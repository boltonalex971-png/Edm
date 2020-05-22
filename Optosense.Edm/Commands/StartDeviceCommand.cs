using Optosense.Edm.Drivers;
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
using System.Diagnostics;

namespace Optosense.Edm.Commands
{
    [Command(Name = "StartDevice", Lifetime = CommandType.LongRunning, Parameters = typeof(StartDeviceCommandParameters))]
    public class StartDeviceCommand : BaseCommand
    {
        protected ICache Cache { get; set; } = CacheHelper.GetInstance();
        protected StartDeviceCommandParameters Parameters => (StartDeviceCommandParameters) CommandParameters;


        private IDeviceDriver _driver;

        public override bool Init()
        {
            try
            {
                _driver = DriverUtils.GetDriver(Parameters.Device);
                var options = DriverUtils.GetDriverOptions(Parameters.Device);
                if (Parameters.DriverOptions != null)
                {
                    JsonConvert.PopulateObject(JsonConvert.SerializeObject(Parameters.DriverOptions), options);
                }

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
            var task = Parameters.Profile.Launch(_driver, (d, x) => ExecuteDeviceInstruction(d, x), CancellationToken);
            await Task.WhenAll(task);
            _driver.Dispose();
            return "Ok";
        }

        private void ExecuteDeviceInstruction(IDeviceDriver driver, string command, bool throwEx = false, int totalRetrials = 0)
        {
            var rec = new Record
            {
                ExecutedAt = DateTime.Now,
                Request = command,
                OperationHostDeviceId = Parameters.OperationHostDevice,
            };
            try
            {
                var response = driver.Execute(command);
                rec.Response = response;
                rec.Status = ExecutionStatus.Succeed;
                rec.IsValid = true;
            }
            catch (Exception e)
            {
                rec.IsValid = false;
                rec.Status = (e.InnerException ?? e) is TimeoutException ? ExecutionStatus.Timeout : ExecutionStatus.Failed;
                rec.Message = string.Join("\n", rec.Message, $"{rec.Status}: {e.InnerException?.Message ?? e.Message}");
#if DEBUG
                Logger.Error($"Instruction \"{rec.Request} {rec.Parameters}\" failed with exception:\n\n{e.GetFullInfo()}");
#endif
            }

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
        public IEnumerable<ProfilePoint> Profile { get; set; }

        [CommandParameter(Required = true)]
        public int OperationHostDevice { get; set; }
        public DeviceModel Device { get; set; }
        public DateTime StartAt { get; set; } = DateTime.Now.AddSeconds(10);

    }

}

