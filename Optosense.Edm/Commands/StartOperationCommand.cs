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
    [Command(Name = "StartOperation", Lifetime = CommandType.LongRunning, Parameters = typeof(StartOperationCommandParameters))]
    public class StartOperationCommand : BaseCommand
    {
        protected ICache Cache { get; set; } = CacheHelper.GetInstance();
        protected StartOperationCommandParameters Parameters => (StartOperationCommandParameters) CommandParameters;

        public override bool Init()
        {
            return true;
        }

        public override async Task<object> ExecuteAsync()
        {
            using (var db = new EdmContext(Parameters.DbConnectionString))
            {
                var devices = await db.OperationHostDevices
                        .Include(d => d.Profile)
                        .Include(d => d.HostDevice.Device)
                        .Include(d => d.HostDevice.Host)
                        .Include(d => d.Profile.Points)
                        .Where(p => p.OperationId == Parameters.Operation)
                        .ToListAsync();

                var remoteCommands = new RemoteCommands();
                foreach (var operationHostDevice in devices)
                {
                    var driverOptions = JsonConvert.DeserializeObject<ExpandoObject>(operationHostDevice.HostDevice.Device.Parameters);
                    JsonConvert.PopulateObject(operationHostDevice.HostDevice.Parameters, driverOptions);
                    JsonConvert.PopulateObject(operationHostDevice.Options, driverOptions);
                    var deviceParams = new StartDeviceCommandParameters
                    {
                        Device = operationHostDevice.HostDevice.Device.Model,
                        DriverOptions = driverOptions,
                        OperationHostDevice = operationHostDevice.Id,
                        StartAt = Parameters.StartAt,
                        Profile = operationHostDevice.Profile.Points
                    };
                    var response = await remoteCommands.Execute(operationHostDevice.HostDevice.Host.Url, "StartDevice", JsonConvert.SerializeObject(deviceParams), Parameters.StartAt);
                }
            }

            return "Ok";
        }

    }

    public class StartOperationCommandParameters : ICommandParameters
    {
        public string CacheConnectionString { get; set; }
        public string DbConnectionString { get; set; }

        [CommandParameter(Required = true)]
        public int Operation { get; set; }
        public DateTime StartAt { get; set; } = DateTime.Now.AddSeconds(10);

    }

}


