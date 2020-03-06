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
using Optosense.Edm.DataAccess;
using Microsoft.EntityFrameworkCore;
using Optosense.Edm.Infrastructure.Edm;
using System.Dynamic;

namespace Optosense.Edm.Commands
{
    [Command(Name = "StartProcess", Lifetime = CommandType.LongRunning, Parameters = typeof(StartProcessCommandParameters))]
    public class StartProcessCommand : BaseCommand
    {
        protected ICache Cache { get; set; } = CacheHelper.GetInstance();
        protected StartProcessCommandParameters Parameters => (StartProcessCommandParameters) CommandParameters;

        public override bool Init()
        {
            return true;
        }

        public override async Task<object> ExecuteAsync()
        {
            using (var db = new EdmContext(Parameters.DbConnectionString))
            {
                var devices = await db.ProcessHostDevices
                        .Include(d => d.Profile)
                        .Include(d => d.HostDevice.Device)
                        .Include(d => d.HostDevice.Host)
                        .Include(d => d.Profile.Points)
                        .Where(p => p.ProcessId == Parameters.Process)
                        .ToListAsync();

                var remoteCommands = new RemoteCommands();
                foreach (var device in devices)
                {
                    var driverOptions = JsonConvert.DeserializeObject<ExpandoObject>(device.HostDevice.Device.Parameters);
                    JsonConvert.PopulateObject(device.HostDevice.Parameters, driverOptions);
                    JsonConvert.PopulateObject(device.Options, driverOptions);
                    var deviceParams = new StartDeviceCommandParameters
                    {
                        Device = device.HostDevice.Device.Type,
                        DriverOptions = driverOptions,
                        Process = device.Id,
                        StartAt = Parameters.StartAt,
                        Profile = device.Profile.Points
                    };
                    var response = await remoteCommands.Execute(device.HostDevice.Host.Url, "StartDevice", JsonConvert.SerializeObject(deviceParams), Parameters.StartAt);
                }
            }

            return "Ok";
        }

    }

    public class StartProcessCommandParameters : ICommandParameters
    {
        public string CacheConnectionString { get; set; }
        public string DbConnectionString { get; set; }

        [CommandParameter(Required = true)]
        public int Process { get; set; }
        public DateTime StartAt { get; set; } = DateTime.Now.AddSeconds(10);

    }

}


