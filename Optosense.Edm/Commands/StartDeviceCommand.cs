using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microprojects.Edm;
using Microprojects.Edm.Commands;
using Microprojects.Edm.Cache;
using Optosense.Edm.Domain.Models;
using Microprojects.Edm.Log;
using Microprojects.Edm.Utils;
using Newtonsoft.Json;
using Optosense.Edm.Utils;
using Optosense.Edm.Plugins;
using Microprojects.Edm.Drivers;

namespace Optosense.Edm.Commands
{
    [Command(Name = "StartDevice", Lifetime = CommandType.LongRunning, Parameters = typeof(StartDeviceCommandParameters))]
    public class StartDeviceCommand : BaseCommand
    {
        protected ICache Cache { get; set; } = CacheHelper.GetInstance();
        protected StartDeviceCommandParameters Parameters => (StartDeviceCommandParameters) CommandParameters;

        private IPluginContainer _plugins;
        private IDriverPlugin _driverPlugin;
        private IProfilePlugin _profilePlugin;
        private IEnumerable<DriverRequest> _executionPlan;
        private IDeviceDriver _driver;
        private DateTime StartTime;

        public StartDeviceCommand() { }

        public StartDeviceCommand(IPluginContainer plugins)
        {
            _plugins = plugins;
        }

        public override bool Init()
        {
            try
            {
                _driverPlugin = _plugins.GetDriver(Parameters.Driver) ?? throw new EdmException("Driver plugin not found");
                _profilePlugin = _plugins.GetProfile(_driverPlugin.ProfileGuid) ?? throw new EdmException("No profiler found");
                _driver = _driverPlugin.GetDriver();
                var options = _driver.GetEffectiveOptions(); //DriverUtils.GetDriverOptions(DeviceModel.None); //Parameters.Driver);
                if (Parameters.DriverOptions != null)
                {
                    JsonConvert.PopulateObject(JsonConvert.SerializeObject(Parameters.DriverOptions), options);
                }

                _executionPlan = _driverPlugin.GetPlan(Parameters.Profile, JsonConvert.SerializeObject(options)).ToList();
                _driver.Options = options;
                _driver.Init();
            }
            catch (Exception e)
            {
                Logger.Error($"Cannot init device with exception: \n\n{e.GetFullInfo()}");
                throw new EdmException($"Cannot init device: {e.Message}");
            }

            return true;
        }

        public override async Task<object> ExecuteAsync()
        {
            StartTime = DateTime.Now;
            var task = _executionPlan.Launch(_driver, (d, x) => ExecuteDeviceInstruction(d, x), CancellationToken);
            await Task.WhenAll(task);
            if (_driver is IDisposable)
            {
                ((IDisposable) _driver).Dispose();
            }

            return "Ok";
        }

        private void ExecuteDeviceInstruction(IDeviceDriver driver, DriverRequest request, bool throwEx = false, int totalRetrials = 0)
        {
            var response = driver.Execute(request);
            var rec = new Record
            {
                ScheduledAt = DateTime.Now,
                ExecutedAt = DateTime.Now,
                Request = response.Request,
                Response = response.Response,
                IsValid = response.State == DriverResponseState.Ok,
                Message = response.Message,
                Parameters = response.Parameters,
                Status = (ExecutionStatus) response.State,
                OperationHostDeviceId = Parameters.OperationHostDevice,
            };

            Cache.Push(rec);
            Logger.Log(rec.Response);
            if (throwEx && !rec.IsValid)
            {
                throw new EdmException(rec.Message);
            }
        }
    }

    public class StartDeviceCommandParameters : ICommandParameters
    {
        public string CacheConnectionString { get; set; }
        public dynamic DriverOptions { get; set; }
        public string Profile { get; set; }

        [CommandParameter(Required = true)]
        public int OperationHostDevice { get; set; }
        public Guid Driver { get; set; }
        public DateTime StartAt { get; set; } = DateTime.Now.AddSeconds(10);

    }

}

