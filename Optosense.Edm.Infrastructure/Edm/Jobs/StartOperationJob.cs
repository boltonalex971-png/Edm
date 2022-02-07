using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microprojects.Edm.Cache;
using Newtonsoft.Json;
using Optosense.Edm.Utils;
using Microsoft.EntityFrameworkCore;
using System.Dynamic;
using Optosense.Edm.Core.Persistance;
using Microprojects.Edm.Jobs;
using Optosense.Edm.Infrastructure.Edm.Jobs;

namespace Optosense.Edm.Jobs
{
    [Job(Name = "StartOperation", Lifetime = JobLifetime.LongRunning, Parameters = typeof(StartOperationJobParameters))]
    public class StartOperationJob : BaseJob
    {
        protected StartOperationJobParameters Parameters => (StartOperationJobParameters) JobParameters;
        protected IJobContainer JobManager { get; init; }
        protected ICache Cache { get; init; }
        protected IEdmContextFactory ContextFactory { get; init; }

        public StartOperationJob() { }
        public StartOperationJob(IJobContainer container, ICache cache, IEdmContextFactory contextFactory)
        {
            JobManager = container;
            ContextFactory = contextFactory;
            Cache = cache;
        }

        public override bool Init()
        {
            return true;
        }

        public override async Task<object> ExecuteAsync()
        {
            var running = new List<(string url, IJob job)>();
            var audits = new List<IJob>();
            // Launch execution result storage
            var storeChannel = $"Operation-{Parameters.Operation}";
            var auditChannel = $"{storeChannel}-audit";
            var storageJob = new StoreOperationRecordsJob
            {
                JobParameters = new StoreOperationRecordsJobParameters { Channel = storeChannel, AuditChannel = auditChannel }
            };
            await JobManager.Execute(storageJob);

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
                    var test = new StartTestOperationJob { JobParameters = JobParameters };
                    return await test.ExecuteAsync(CancellationToken);
                }

                foreach (var operationHostDevice in devices)
                {
                    // Launch audits
                    foreach (var audit in operationHostDevice.Profile.Audits)
                    {
                        var auditParams = new StartAuditJobParameters
                        {
                            Audit = audit.Id,
                            Operation = Parameters.Operation,
                            Channel = auditChannel,
                            StartAt = Parameters.StartAt
                        };
                        var auditJob = new StartAuditJob { JobParameters = auditParams };
                        await JobManager.Execute(auditJob);
                        audits.Add(auditJob);
                    }

                    // Launch devices
                    var driverOptions = JsonConvert.DeserializeObject<ExpandoObject>(operationHostDevice.HostDevice.Device.Parameters ?? "{}");
                    JsonConvert.PopulateObject(operationHostDevice.HostDevice.Parameters ?? "{}", driverOptions);
                    JsonConvert.PopulateObject(operationHostDevice.Options ?? "{}", driverOptions);
                    var deviceParams = new StartDeviceJobParameters
                    {
                        Driver = operationHostDevice.HostDevice.Device.DriverGuid,
                        DriverOptions = driverOptions,
                        OperationHostDevice = operationHostDevice.Id,
                        StartAt = Parameters.StartAt,
                        Profile = operationHostDevice.Profile.TextJson,
                        Channel = storeChannel
                    };
                    var url = $"{operationHostDevice.HostDevice.Host.Url}:{operationHostDevice.HostDevice.Host.Port}";
                    var deviceJob = new StartDeviceJob { JobParameters = deviceParams };
                    running.Add((url, deviceJob));
                    // TODO check response for validity
                    var response = await deviceJob.Execute(url);

                }
            }

            int count;
            do
            {
                count = 0;
                await Task.Delay(10000, CancellationToken);
                foreach (var (url, job) in running)
                {
                    var check = new CheckJob(job);
                    var parameter = new
                    {
                        Job = job.Name,
                        ((StartDeviceJobParameters) job.JobParameters).OperationHostDevice,
                        ((StartDeviceJobParameters) job.JobParameters).Driver
                    };
                    var response = //dev.url.Contains("localhost") ?
                        await JobManager.Execute(check, parameter);
                        //await check.RemoteExecute(dev.url, parameter);
                    if (response.Status == "Ok" && Enum.TryParse(response.Message, out TaskStatus jobStatus))
                    {
                        if (jobStatus == TaskStatus.Running ||
                                jobStatus == TaskStatus.WaitingForActivation ||
                                jobStatus == TaskStatus.WaitingToRun ||
                                jobStatus == TaskStatus.WaitingForChildrenToComplete)
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
                await JobManager.Execute(new StopJob(audit));
            }

            // Stop storage
            await JobManager.Execute(new StopJob(storageJob));

            using (var db = ContextFactory.Create())
            {
                var operation = await db.Operations.FindAsync(Parameters.Operation);
                operation.Completed = DateTime.Now;
                await db.SaveChangesAsync();
            }

            return "Ok";
        }
    }

    public class StartOperationJobParameters : IJobParameters
    {
        [JobParameter(Required = true)]
        public int Operation { get; set; }
        public DateTime StartAt { get; set; } = DateTime.Now.AddSeconds(10);

    }

}


