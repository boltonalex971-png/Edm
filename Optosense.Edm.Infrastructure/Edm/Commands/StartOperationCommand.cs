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
using Optosense.Edm.Infrastructure.Edm.Commands;

namespace Optosense.Edm.Commands
{
    [Command(Name = "StartOperation", Lifetime = CommandType.LongRunning, Parameters = typeof(StartOperationCommandParameters))]
    public class StartOperationCommand : BaseCommand
    {
        protected ICache Cache { get; set; } = CacheHelper.GetInstance();
        protected StartOperationCommandParameters Parameters => (StartOperationCommandParameters) CommandParameters;
        protected ICommandContainer CommandManager { get; set; }

        public StartOperationCommand(ICommandContainer container)
        {
            CommandManager = container;
        }

        public override bool Init()
        {
            return true;
        }

        public override async Task<object> ExecuteAsync()
        {
            var running = new List<(string url, ICommand command)>();
            using (var db = new EdmContext(Parameters.DbConnectionString))
            {
                var devices = await db.OperationHostDevices
                        .Include(d => d.Profile)
                        .Include(d => d.HostDevice.Device)
                        .Include(d => d.HostDevice.Host)
                        .Include(d => d.Profile.Points)
                        .Where(p => p.OperationId == Parameters.Operation)
                        .ToListAsync();
                if (devices.All(d => d.HostDevice.Device.DriverGuid == Guid.Empty))
                {
                    // Start test operation if all devices of type None
                    var test = new StartTestOperationCommand { CommandParameters = CommandParameters };
                    return await test.ExecuteAsync(CancellationToken);
                }

                foreach (var operationHostDevice in devices)
                {
                    var driverOptions = JsonConvert.DeserializeObject<ExpandoObject>(operationHostDevice.HostDevice.Device.Parameters ?? "{}");
                    JsonConvert.PopulateObject(operationHostDevice.HostDevice.Parameters ?? "{}", driverOptions);
                    JsonConvert.PopulateObject(operationHostDevice.Options ?? "{}", driverOptions);
                    var deviceParams = new StartDeviceCommandParameters
                    {
                        Driver = operationHostDevice.HostDevice.Device.DriverGuid,
                        DriverOptions = driverOptions,
                        OperationHostDevice = operationHostDevice.Id,
                        StartAt = Parameters.StartAt,
                        Profile = operationHostDevice.Profile.TextJson
                    };
                    var url = $"{operationHostDevice.HostDevice.Host.Url}:{operationHostDevice.HostDevice.Host.Port}";
                    var deviceCommand = new StartDeviceCommand { CommandParameters = deviceParams };
                    running.Add((url, deviceCommand));
                    var response = url.Contains("localhost") ?
                        await CommandManager.LocalExecute(deviceCommand) :
                        await deviceCommand.RemoteExecute(url);
                    // TODO check response for validity
                }
            }

            int count;
            do
            {
                count = 0;
                await Task.Delay(10000, CancellationToken);
                foreach (var dev in running)
                {
                    var check = new CheckCommand(dev.command);
                    var parameter = new
                    {
                        Command = dev.command.Name,
                        ((StartDeviceCommandParameters) dev.command.CommandParameters).OperationHostDevice,
                        ((StartDeviceCommandParameters) dev.command.CommandParameters).Driver
                    };
                    var response = dev.url.Contains("localhost") ?
                        await CommandManager.LocalExecute(check, parameter) :
                        await check.RemoteExecute(dev.url, parameter);
                    if (response.Status == "Ok" && Enum.TryParse(response.Message, out TaskStatus commandStatus))
                    {
                        if (commandStatus == TaskStatus.Running ||
                                commandStatus == TaskStatus.WaitingForActivation ||
                                commandStatus == TaskStatus.WaitingToRun ||
                                commandStatus == TaskStatus.WaitingForChildrenToComplete)
                        {
                            continue;
                        }
                        else
                        {
                            count++;
                        }
                    }
                }
            } while (count < running.Count);

            using (var db = new EdmContext(Parameters.DbConnectionString))
            {
                var operation = await db.Operations.FindAsync(Parameters.Operation);
                operation.Completed = DateTime.Now;
                await db.SaveChangesAsync();
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


