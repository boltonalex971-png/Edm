using AdaptiveExpressions;
using Microprojects.Edm.Drivers;
using Microprojects.Edm.Intercom;
using Microprojects.Edm.Jobs;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Optosense.Edm.Plugins;
using Optosense.Edm.Utils;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Optosense.Edm.Core.Models;
using Optosense.Edm.Intercom.Events;

namespace Optosense.Edm.Jobs
{
    [Job(Name = "StartDevice", Lifetime = JobLifetime.LongRunning, Parameters = typeof(StartDeviceJobParameters))]
    public class StartDeviceJob : BaseJob, IContainDriver
    {
        protected event EventHandler<InputParamEvent> InputParamArrived;
        protected event EventHandler<LifecycleEvent> LifecycleArrived;

        protected IIntercom Intercom { get; init; }
        protected StartDeviceJobParameters Parameters => (StartDeviceJobParameters)JobParameters;

        private readonly ILogger<StartDeviceJob> _logger;
        private readonly IPluginContainer _plugins;
        private IDriverPlugin _driverPlugin;
        private IEnumerable<DriverRequest> _executionPlan;
        private IAsyncEnumerable<DriverRequest> _asyncPlan;
        private IDeviceDriver _driver;
        private IProfilePlugin _profilerPlugin;

        // List of profile parameters for internal use
        private Dictionary<string, object> _internalParams = [];
        private readonly ConcurrentDictionary<string, object> _inputParams = [];
        private Dictionary<string, object> _outputParams;
        private IDisposable _paramSubscriber;

        public StartDeviceJob()
        {
        }

        public StartDeviceJob(ILogger<StartDeviceJob> logger, IPluginContainer plugins, IIntercom intercom)
        {
            _logger = logger;
            _plugins = plugins;
            Intercom = intercom;
        }

        public override Task<bool> InitAsync()
        {
            try
            {
                _profilerPlugin = _plugins.GetProfile(Parameters.Profiler) ??
                                  throw new EdmException("Profiler plugin not found");
                _driverPlugin = _plugins.GetDriver(Parameters.Driver) ??
                                throw new EdmException("Driver plugin not found");
                _driver = _driverPlugin.GetDriver(Parameters);
                if (_driver is IReactiveDriver reactiveDriver)
                {
                    reactiveDriver.PushResponse = PushResponse;
                }

                if (_driver is INeedIntercom driverWithIntercom)
                {
                    driverWithIntercom.Intercom = Intercom;
                }

                var options =
                    _driver.GetEffectiveOptions(); //DriverUtils.GetDriverOptions(DeviceModel.None); //Parameters.Driver);
                if (Parameters.DriverOptions != null)
                {
                    JsonConvert.PopulateObject(JsonConvert.SerializeObject(Parameters.DriverOptions), options);
                }

                if (_driverPlugin is IAsyncPlanProvider asyncPlanProvider)
                {
                    _asyncPlan = asyncPlanProvider.GetAsyncPlan(
                        Parameters.Profile,
                        JsonConvert.SerializeObject(options),
                        Parameters.StartAt);
                }
                else
                {
                    _executionPlan = _driverPlugin.GetPlan(Parameters.Profile, JsonConvert.SerializeObject(options))
                        .ToList();
                }

                _driver.Options = options;
                _driver.Init();

                _outputParams = JsonConvert.DeserializeObject<IEnumerable<string>>(Parameters.OutputParameters ?? "[]")
                    .ToDictionary(k => k, e => default(object));
                _internalParams = _profilerPlugin.GetParameters(Parameters.Profile)
                    .ToDictionary(k => k, e => default(object));
                _paramSubscriber = Intercom.UseId(Parameters.Operation).HandleParameter(async param =>
                {
                    if (param.Key == "Stop" && (bool)param.Value)
                    {
                        if (!CancellationTokenSource.IsCancellationRequested)
                            await CancellationTokenSource.CancelAsync()
                                .ContinueWith((t) => { }); // Ignore exceptions
                        return;
                    }

                    if (param.Key.StartsWith('?'))
                    {
                        var name = param.Key[1..];
                        if (!Parameters.OutputParameters.Contains(name) || _driver is not IParamProvider)
                            return;

                        var planned = DateTime.UtcNow;
                        var result = await ((IParamProvider)_driver).GetParam(name);
                        result.Planned = (long)(planned - Parameters.StartAt).TotalMilliseconds;
                        result.Executed = (long)(DateTime.UtcNow - Parameters.StartAt).TotalMilliseconds;
                        await PushResponse(result);

                        return;
                    }

                    if ((Parameters.InputParameters?.Contains(param.Key) ?? false) &&
                        _driver is IParamConsumer consumer)
                    {
                        await consumer.SetParamAsync(param.Key, param.Value);
                    }

                    PushInputParameter(KeyValuePair.Create(param.Key, param.Value));
                });
                _logger.LogDebug("Device {Device} inited at {Time}", _driver.GetType().Name,
                    DateTime.UtcNow.ToString("hh:mm:ss.fff"));
            }
            catch (Exception e)
            {
                _logger.LogError(Parameters.Operation, e, "Cannot init device");
                throw new EdmException($"Cannot init {_driverPlugin.Name}: {e.Message}");
            }

            return Task.FromResult(true);
        }

        public override async Task<object> ExecuteAsync()
        {
            var startCancellationTokenSource = CancellationTokenSource.CreateLinkedTokenSource(CancellationToken);
            using var lifecycle = Intercom.UseId(Parameters.Operation).HandleLifecycle(d =>
            {
                switch (d.State)
                {
                    case nameof(OperationState.InProgress):
                        startCancellationTokenSource.Cancel();
                        break;
                    case nameof(OperationState.Cancelled):
                        CancellationTokenSource.Cancel();
                        break;
                }
                
                return  Task.CompletedTask;
            });
            try
            {
                // Wait until operation lifecycle start event arrived
                await Task.Delay(-1, startCancellationTokenSource.Token).ContinueWith((t) => { });
                _logger.LogInformation("Device {Device} run to execute at {Time}", _driver.GetType().Name,
                    DateTime.UtcNow.ToString("hh:mm:ss.fff"));
                if (_asyncPlan != null)
                {
                    await foreach (var request in _asyncPlan.WithCancellation(CancellationToken))
                    {
                        if (request.Condition != null)
                        {
                            await MeetCondition(request);
                        }

                        await ExecuteDeviceInstruction(_driver, request);
                    }
                }
                else
                {
                    await _executionPlan.Launch(
                        _driver,
                        MeetCondition,
                        (d, x) => ExecuteDeviceInstruction(d, x),
                        _logger, CancellationToken);
                }
            }
            catch (OperationCanceledException)
            {
                // Release audits and store jobs
                await ExecuteDeviceInstruction(_driver, DriverRequests.Stop);
            }

            return "Ok";
        }

        protected override void Dispose(bool disposing)
        {
            base.Dispose(disposing);
            _paramSubscriber?.Dispose();
            if (_driver is IDisposable disposableDriver)
            {
                disposableDriver.Dispose();
            }
        }

        private async Task ExecuteDeviceInstruction(IDeviceDriver driver, DriverRequest request, bool throwEx = false,
            int totalRetrials = 0)
        {
            request.Parameters = SubstituteParameters(request.Parameters);
            // TODO cyclic commands here: add repeat interval and stop condition to DriverRequest
            if (request.Repeat != null && request.Repeat > 0)
            {
                var tokenSource = new CancellationTokenSource();
                var task = Task.Factory.StartNew(async () =>
                {
                    do
                    {
                        var response = await driver.Execute(request);
                        if (response != null)
                        {
                            await PushResponse(response);
                        }

                        await Task.Delay(request.Repeat.Value * 1000, tokenSource.Token);
                    } while (!tokenSource.Token.IsCancellationRequested);
                });
                await MeetCondition(request.Until);
                tokenSource.Cancel();
                await task.ContinueWith((t) => { });
            }
            else
            {
                var response = await driver.Execute(request);
                if (response != null)
                {
                    await PushResponse(response);
                }
            }
        }

        private string SubstituteParameters(string parameters)
        {
            var result = parameters ?? string.Empty;
            foreach (var p in _inputParams)
            {
                result = result.Replace($"{{{p.Key}}}", p.Value?.ToString());
            }

            return result;
        }


        private async Task PushResponse(DriverResponse response, bool throwEx = false)
        {
            var rec = new DeviceResponseEvent
            {
                ScheduledAt = Parameters.StartAt.AddMilliseconds(response.Planned),
                ExecutedAt = DateTime.UtcNow,
                Request = response.Request,
                Response = response.Response,
                IsValid = response.State == DriverResponseState.Ok,
                Message = response.Message,
                Parameters = response.Parameters,
                Status = response.State,
                OperationHostDeviceId = Parameters.OperationHostDevice,
            };
            await Intercom.PublishDeviceResponseAsync(Parameters.Operation, rec);
            var output = JsonConvert.DeserializeObject<IDictionary<string, object>>(
                string.IsNullOrEmpty(response.Parameters) ? "{}" : response.Parameters);
            foreach (var param in output)
            {
                if (_outputParams.ContainsKey(param.Key) || param.Key == "Stop")
                {
                    await PushOutputParameterAsync(param);
                }
                else if (_internalParams.ContainsKey(param.Key))
                {
                    PushInputParameter(param);
                }
            }

            if (throwEx && response.State != DriverResponseState.Ok)
            {
                throw new EdmException(response.Message);
            }
        }

        private void PushInputParameter(KeyValuePair<string, object> param)
        {
            _inputParams[param.Key] = param.Value;
            InputParamArrived?.Invoke(this, new InputParamEvent
            {
                Param = param.Key,
                Value = _inputParams[param.Key],
                ArrivedAt = DateTime.UtcNow
            });
        }

        private async Task PushOutputParameterAsync(KeyValuePair<string, object> param)
        {
            _outputParams[param.Key] = param.Value;
            await Intercom.PublishParameterAsync(Parameters.Operation,
                new ParameterEvent { Key = param.Key, Value = param.Value });
        }

        private Task<bool> MeetCondition(DriverRequest req)
        {
            return MeetCondition(req.Condition);
        }

        private async Task<bool> MeetCondition(string condition)
        {
            if (string.IsNullOrEmpty(condition))
            {
                return true;
            }

            var expr = Expression.Parse(condition);
            if (expr.Type == ExpressionType.Constant)
            {
                var (offset, error) = expr.TryEvaluate<double>(_inputParams);
                // Offset in seconds
                await Task.Delay((int)(offset * 1000), CancellationToken);
            }
            else if (expr.Type == ExpressionType.Accessor)
            {
                var cancellationSource = CancellationTokenSource.CreateLinkedTokenSource(CancellationToken);
                EventHandler<InputParamEvent> handler = (source, args) =>
                {
                    if (args.Param == condition || CancellationToken.IsCancellationRequested)
                    {
                        cancellationSource.Cancel();
                    }
                };

                InputParamArrived += handler;
                await PushOutputParameterAsync(new KeyValuePair<string, object>($"?{condition}", null))
                    .ContinueWith(t =>
                    {
                        if (t is { Status: TaskStatus.Faulted, Exception: not null })
                            throw t.Exception;
                    });

                await Task.Delay(-1, cancellationSource.Token).ContinueWith(t => { });
                InputParamArrived -= handler;
            }
            else if (!expr.TryEvaluate<bool>(_inputParams).value)
            {
                var cancellationSource = new CancellationTokenSource();
                EventHandler<InputParamEvent> handler = (source, args) =>
                {
                    var (confirmed, error) = expr.TryEvaluate<bool>(_inputParams);
                    if (error is not null)
                    {
                        _logger.LogError(Parameters.Operation,
                            "Cannot evaluate profile condition <{condition}>: {error}", condition, error);
                    }

                    if (confirmed || CancellationToken.IsCancellationRequested)
                    {
                        cancellationSource.Cancel();
                    }
                };
                InputParamArrived += handler;
                // TODO Get task awake to check if the notification missed
                await Task.Delay(-1, cancellationSource.Token).ContinueWith(t => { });
                InputParamArrived -= handler;
            }

            return !CancellationToken.IsCancellationRequested;
        }

        public Guid GetDriverGuid() => Parameters.Driver;

        public IDeviceDriver GetDriver() => _driver;

        public string GetProfile() => Parameters.Profile;

        public int GetOperationId() => Parameters.Operation;
    }

    public class StartDeviceJobParameters : DeviceParameters, IJobParameters
    {
        [JobParameter(Required = true)] public int OperationHostDevice { get; set; }
        [JobParameter(Required = true)] public int Operation { get; set; }
        public Guid Profiler { get; set; }
        public Guid Driver { get; set; }
        public DateTime StartAt { get; set; } = DateTime.UtcNow.AddSeconds(10);
    }
}