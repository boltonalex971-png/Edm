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
using System.Linq;
using System.Threading.Tasks;

namespace Optosense.Edm.Jobs
{
    [Job(Name = "StartDevice", Lifetime = JobLifetime.LongRunning, Parameters = typeof(StartDeviceJobParameters))]
    public class StartDeviceJob : BaseJob
    {
        protected ICache Cache { get; init; }
        protected StartDeviceJobParameters Parameters => (StartDeviceJobParameters)JobParameters;

        private readonly ILogger<StartDeviceJob> _logger;
        private IPluginContainer _plugins;
        private IDriverPlugin _driverPlugin;
        //private IProfilePlugin _profilePlugin;
        private IEnumerable<DriverRequest> _executionPlan;
        private IDeviceDriver _driver;
        private DateTime _startTime;
        private Dictionary<string, object> _inputParams;
        private Dictionary<string, object> _outputParams;

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
                _driverPlugin = _plugins.GetDriver(Parameters.Driver) ?? throw new EdmException("Driver plugin not found");
                //_profilePlugin = _plugins.GetProfile(_driverPlugin.ProfileGuid) ?? throw new EdmException("No profiler found");
                _driver = _driverPlugin.GetDriver();
                var options = _driver.GetEffectiveOptions(); //DriverUtils.GetDriverOptions(DeviceModel.None); //Parameters.Driver);
                if (Parameters.DriverOptions != null)
                {
                    JsonConvert.PopulateObject(JsonConvert.SerializeObject(Parameters.DriverOptions), options);
                }

                _executionPlan = _driverPlugin.GetPlan(Parameters.Profile, JsonConvert.SerializeObject(options)).ToList();
                _driver.Options = options;
                _driver.Init();

                _inputParams = JsonConvert.DeserializeObject<IEnumerable<string>>(Parameters.InputParameters ?? "[]")
                    .ToDictionary(k => k, e => default(object));
                _outputParams = JsonConvert.DeserializeObject<IEnumerable<string>>(Parameters.OutputParameters ?? "[]")
                    .ToDictionary(k => k, e => default(object));
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
            var subscriber = Cache.Subscribe<KeyValuePair<string, object>>(Parameters.ParametersChannel,
                onNext: param =>
                {
                    Console.WriteLine(param);
                    if (_inputParams.ContainsKey(param.Key))
                    {
                        _inputParams[param.Key] = param.Value;
                    }
                });
            await _executionPlan.Launch(_driver, async (d, x) => await ExecuteDeviceInstruction(d, x),
                _logger, CancellationToken)
                .ContinueWith(t => { }); // To ignore cancel exception
            subscriber.Dispose();
            if (_driver is IDisposable)
            {
                ((IDisposable)_driver).Dispose();
            }

            return "Ok";
        }

        private async Task ExecuteDeviceInstruction(IDeviceDriver driver, DriverRequest request, bool throwEx = false, int totalRetrials = 0)
        {
            var response = await driver.Execute(request);
            var rec = new Record
            {
                ScheduledAt = DateTime.Now,
                ExecutedAt = DateTime.Now,
                Request = response.Request,
                Response = response.Response,
                IsValid = response.State == DriverResponseState.Ok,
                Message = response.Message,
                Parameters = response.Parameters,
                Status = (ExecutionStatus)response.State,
                OperationHostDeviceId = Parameters.OperationHostDevice,
            };
            await Cache.Publish(Parameters.StoreChannel, rec);
            var output = JsonConvert.DeserializeObject<Dictionary<string, object>>(rec.Parameters ?? "[]");
            foreach (var outParam in _outputParams)
            {
                if (output.ContainsKey(outParam.Key))
                {
                    _outputParams[outParam.Key] = outParam.Value;
                    await Cache.Publish(Parameters.ParametersChannel, outParam);
                }
            }

            if (throwEx && !rec.IsValid)
            {
                throw new EdmException(rec.Message);
            }
        }

        private async Task AwaitEvent(string condition)
        {

        }
    }

    public class StartDeviceJobParameters : IJobParameters
    {
        public string StoreChannel { get; set; }
        public string ParametersChannel { get; set; }
        public dynamic DriverOptions { get; set; }
        public string Profile { get; set; }
        public string InputParameters { get; set; }
        public string OutputParameters { get; set; }

        [JobParameter(Required = true)]
        public int OperationHostDevice { get; set; }
        public Guid Driver { get; set; }
        public DateTime StartAt { get; set; } = DateTime.Now.AddSeconds(10);
    }

}

