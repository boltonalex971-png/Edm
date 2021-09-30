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
using Optosense.Edm.Core.Persistance;

namespace Optosense.Edm.Commands
{
    [Command(Name = "StartOperation", Lifetime = CommandType.LongRunning, Parameters = typeof(StartOperationCommandParameters))]
    public class StartOperationCommand : BaseCommand
    {
        protected StartOperationCommandParameters Parameters => (StartOperationCommandParameters) CommandParameters;
        protected ICommandContainer CommandManager { get; init; }
        protected ICache Cache { get; init; }
        protected IEdmContextFactory ContextFactory { get; init; }

        public StartOperationCommand() { }
        public StartOperationCommand(ICommandContainer container, ICache cache, IEdmContextFactory contextFactory)
        {
            CommandManager = container;
            ContextFactory = contextFactory;
            Cache = cache;
        }

        public override bool Init()
        {
            return true;
        }

        public override async Task<object> ExecuteAsync()
        {
            var running = new List<(string url, ICommand command)>();
            var audits = new List<ICommand>();
            // Launch execution result storage
            var storeChannel = $"Operation-{Parameters.Operation}";
            var auditChannel = $"{storeChannel}-audit";
            var storageCommand = new StoreOperationRecordsCommand
            {
                CommandParameters = new StoreOperationRecordsCommandParameters { Channel = storeChannel, AuditChannel = auditChannel }
            };
            await CommandManager.LocalExecute(storageCommand);

            // Launch devices
            using (var db = ContextFactory.Create())
            {
                var devices = await db.OperationHostDevices
                        .Include(d => d.Profile.Audits)
                        .Include(d => d.HostDevice.Device)
                        .Include(d => d.HostDevice.Host)
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
                    // Launch audits
                    foreach (var audit in operationHostDevice.Profile.Audits)
                    {
                        var auditParams = new StartAuditCommandParameters
                        {
                            Audit = audit.Id,
                            Operation = Parameters.Operation,
                            Channel = auditChannel,
                            StartAt = Parameters.StartAt
                        };
                        var auditCommand = new StartAuditCommand { CommandParameters = auditParams };
                        await CommandManager.LocalExecute(auditCommand);
                        audits.Add(auditCommand);
                    }

                    // Launch devices
                    var driverOptions = JsonConvert.DeserializeObject<ExpandoObject>(operationHostDevice.HostDevice.Device.Parameters ?? "{}");
                    JsonConvert.PopulateObject(operationHostDevice.HostDevice.Parameters ?? "{}", driverOptions);
                    JsonConvert.PopulateObject(operationHostDevice.Options ?? "{}", driverOptions);
                    var deviceParams = new StartDeviceCommandParameters
                    {
                        Driver = operationHostDevice.HostDevice.Device.DriverGuid,
                        DriverOptions = driverOptions,
                        OperationHostDevice = operationHostDevice.Id,
                        StartAt = Parameters.StartAt,
                        Profile = operationHostDevice.Profile.TextJson,
                        Channel = storeChannel
                    };
                    var url = $"{operationHostDevice.HostDevice.Host.Url}:{operationHostDevice.HostDevice.Host.Port}";
                    var deviceCommand = new StartDeviceCommand { CommandParameters = deviceParams };
                    running.Add((url, deviceCommand));
                    // TODO check response for validity
                    var response = //url.Contains("localhost") ?
                                   //await CommandManager.LocalExecute(deviceCommand);
                        await deviceCommand.RemoteExecute(url);

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
                    var response = //dev.url.Contains("localhost") ?
                        await CommandManager.LocalExecute(check, parameter);
                        //await check.RemoteExecute(dev.url, parameter);
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

            // Stop audits
            foreach (var audit in audits)
            {
                await CommandManager.LocalExecute(new StopCommand(audit));
            }

            // Stop storage
            await CommandManager.LocalExecute(new StopCommand(storageCommand));

            using (var db = ContextFactory.Create())
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
        [CommandParameter(Required = true)]
        public int Operation { get; set; }
        public DateTime StartAt { get; set; } = DateTime.Now.AddSeconds(10);

    }

}


