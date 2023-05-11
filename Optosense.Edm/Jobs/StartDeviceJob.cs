using AdaptiveExpressions;
using Microprojects.Edm.Cache;
using Microprojects.Edm.Drivers;
using Microprojects.Edm.Jobs;
using Microprojects.Edm.Utils;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Optosense.Edm.Domain.Models;
using Optosense.Edm.Plugins;
using Optosense.Edm.Utils;
using System;
using System.Collections.Generic;
using System.Dynamic;
using System.Linq;
using System.Reflection.Metadata;
using System.Threading;
using System.Threading.Tasks;

namespace Optosense.Edm.Jobs
{
    [Job(Name = "StartDevice", Lifetime = JobLifetime.LongRunning, Parameters = typeof(StartDeviceJobParameters))]
    public class StartDeviceJob : BaseJob, IContainDriver
    {
        public event EventHandler<InputParamArrivedEventArgs> InputParamArrived;

        protected ICache Cache { get; init; }
        protected StartDeviceJobParameters Parameters => (StartDeviceJobParameters)JobParameters;

        private readonly ILogger<StartDeviceJob> _logger;
        private IPluginContainer _plugins;
        private IDriverPlugin _driverPlugin;
        //private IProfilePlugin _profilePlugin;
        private IEnumerable<DriverRequest> _executionPlan;
        private IDeviceDriver _driver;
        private IProfilePlugin _profilerPlugin;
        private DateTime _startTime;
        // List of profile parameters for internal use
        private Dictionary<string, object> _internalParams = new();
        private Dictionary<string, object> _inputParams = new();
        private Dictionary<string, object> _outputParams;
        private IDisposable _subscriber;

        public StartDeviceJob() { }

        public StartDeviceJob(ILogger<StartDeviceJob> logger, IPluginContainer plugins, ICache cache)
        {
            _logger = logger;
            _plugins = plugins;
            Cache = cache;
        }

        public override bool Init()
        {
            try
            {
                _profilerPlugin = _plugins.GetProfile(Parameters.Profiler) ?? throw new EdmException("Profiler plugin not found");
                _driverPlugin = _plugins.GetDriver(Parameters.Driver) ?? throw new EdmException("Driver plugin not found");
                //_profilePlugin = _plugins.GetProfile(_driverPlugin.ProfileGuid) ?? throw new EdmException("No profiler found");
                _driver = _driverPlugin.GetDriver();
                if (_driver is IReactiveDriver reactiveDriver)
                {
                    reactiveDriver.PushResponse = PushResponse;
                }

                var options = _driver.GetEffectiveOptions(); //DriverUtils.GetDriverOptions(DeviceModel.None); //Parameters.Driver);
                if (Parameters.DriverOptions != null)
                {
                    JsonConvert.PopulateObject(JsonConvert.SerializeObject(Parameters.DriverOptions), options);
                }

                _executionPlan = _driverPlugin.GetPlan(Parameters.Profile, JsonConvert.SerializeObject(options)).ToList();
                _driver.Options = options;
                _driver.Init();

                _outputParams = JsonConvert.DeserializeObject<IEnumerable<string>>(Parameters.OutputParameters ?? "[]")
                    .ToDictionary(k => k, e => default(object));
                _internalParams = _profilerPlugin.GetParameters(Parameters.Profile)
                    .ToDictionary(k => k, e => default(object));
                _subscriber = Cache.Subscribe(Parameters.ParametersChannel,
                    onNext: json =>
                    {
                        var param = JsonConvert.DeserializeObject<KeyValuePair<string, object>>(json.ToString());
                        if (param.Key == "Stop" && (bool)param.Value) 
                        { 
                            CancellationTokenSource.Cancel();
                            return;
                        }

                        PushInputParameter(param);
                    });
            }
            catch (Exception e)
            {
                _logger.LogError("Cannot init device with exception: \n{Exception}", e.GetFullInfo());
                throw new EdmException($"Cannot init device: {e.Message}");
            }

            return true;
        }

        public override async Task<object> ExecuteAsync()
        {
            _startTime = DateTime.Now;
            await _executionPlan.Launch(
                _driver,
                MeetCondition,
                (d, x) => ExecuteDeviceInstruction(d, x),
                _logger, CancellationToken)
                .ContinueWith(t => { }); // To ignore cancel exception
            if (CancellationToken.IsCancellationRequested)
            {
                // Release related audits and store jobs
                await ExecuteDeviceInstruction(_driver, DriverRequests.Stop);
            }

            _subscriber.Dispose();
            if (_driver is IDisposable)
            {
                ((IDisposable)_driver).Dispose();
            }

            return "Ok";
        }

        private async Task ExecuteDeviceInstruction(IDeviceDriver driver, DriverRequest request, bool throwEx = false, int totalRetrials = 0)
        {
            // cyclic commands here: add repeat interval and stop condition to DriverRequest
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

        private async Task PushResponse(DriverResponse response, bool throwEx = false)
        {
            var rec = new Record
            {
                ScheduledAt = _startTime + TimeSpan.FromMilliseconds(response.Planned),
                ExecutedAt = _startTime + TimeSpan.FromMilliseconds(response.Executed),
                Request = response.Request,
                Response = response.Response,
                IsValid = response.State == DriverResponseState.Ok,
                Message = response.Message,
                Parameters = response.Parameters,
                Status = (ExecutionStatus)response.State,
                OperationHostDeviceId = Parameters.OperationHostDevice,
            };
            await Cache.Publish(Parameters.StoreChannel, rec);
            var output = JsonConvert.DeserializeObject<IDictionary<string, object>>(rec.Parameters ?? "{}");
            foreach (var param in output)
            {
                if (_outputParams.ContainsKey(param.Key))
                {
                    // Do not wait pushing parameters
                    PushOutputParameterAsync(param);
                }
                else if(_internalParams.ContainsKey(param.Key))
                {
                    PushInputParameter(param);
                }
            }

            if (throwEx && !rec.IsValid)
            {
                throw new EdmException(rec.Message);
            }
        }

        private void PushInputParameter(KeyValuePair<string, object> param)
        {
            _inputParams[param.Key] = param.Value;
            InputParamArrived?.Invoke(this, new InputParamArrivedEventArgs
            {
                Param = param.Key,
                Value = _inputParams[param.Key],
                ArrivedAt = DateTime.Now
            });
        }

        private async Task PushOutputParameterAsync(KeyValuePair<string, object> param)
        {
            _outputParams[param.Key] = param.Value;
            await Cache.Publish(Parameters.ParametersChannel, param);
        }

        private Task<bool> MeetCondition(DriverRequest req)
        {
            return MeetCondition(req.Condition);
        }

        private async Task<bool> MeetCondition(string condition)
        {
            var expr = Expression.Parse(condition);
            if (expr.Type == ExpressionType.Constant)
            {
                var (offset, error) = expr.TryEvaluate<int>(_inputParams);
                // Offset in seconds
                await Task.Delay(offset * 1000, CancellationToken);
            }
            else if (!expr.TryEvaluate<bool>(_inputParams).value)
            {
                var cancellationSource = new CancellationTokenSource();
                EventHandler<InputParamArrivedEventArgs> handler = (source, args) =>
                {
                    var (confirmed, error) = expr.TryEvaluate<bool>(_inputParams);
                    if (error is not null)
                    {
                        _logger.LogError("Cannot evaluate profile condition <{condition}>: {error}", condition, error);
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
                if (CancellationToken.IsCancellationRequested)
                {
                    return false;
                }
            }

            return true;
        }

        public Guid GetDriverGuid() => Parameters.Driver;

        public IDeviceDriver GetDriver() => _driver;

        public string GetProfile() => Parameters.Profile;

        public int GetOperationId() => Parameters.Operation;
    }

    public class StartDeviceJobParameters : IJobParameters
    {
        [JobParameter(Required = true)]
        public int OperationHostDevice { get; set; }
        [JobParameter(Required = true)]
        public int Operation { get; set; }
        public string StoreChannel { get; set; }
        public string ParametersChannel { get; set; }
        public dynamic DriverOptions { get; set; }
        public string Profile { get; set; }
        public Guid Profiler { get; set; }
        public string InputParameters { get; set; }
        public string OutputParameters { get; set; }
        public Guid Driver { get; set; }
        public DateTime StartAt { get; set; } = DateTime.Now.AddSeconds(10);
    }

    public class InputParamArrivedEventArgs : EventArgs
    {
        public string Param { get; set; }
        public object Value { get; set; }
        public DateTime ArrivedAt { get; set; }
    }
}

