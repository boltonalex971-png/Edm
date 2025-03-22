using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Newtonsoft.Json;
using Optosense.Edm.Utils;
using System.Dynamic;
using Microprojects.Edm.Jobs;
using Optosense.Edm.Infrastructure.Edm.Jobs;
using Optosense.Edm.Core.Contracts;
using Microprojects.Edm.Intercom;
using Microsoft.Extensions.Logging;
using Microprojects.Edm.Utils;
using Optosense.Edm.Infrastructure.Protos;

namespace Optosense.Edm.Jobs
{
    [Job(Name = "StartOperation", Lifetime = JobLifetime.LongRunning, Parameters = typeof(StartOperationJobParameters))]
    public class StartOperationJob : BaseJob, IKnowOperation
    {
        protected StartOperationJobParameters Parameters => (StartOperationJobParameters)JobParameters;
        protected IOperationService OperationService { get; init; }
        protected IProfileService ProfileService { get; init; }
        protected IJobContainer JobManager { get; init; }
        protected IIntercom Intercom { get; init; }
        protected ILogger<StartOperationJob> Logger { get; init; }

        public StartOperationJob() { }
        public StartOperationJob(
            IOperationService operationService,
            IProfileService profileService,
            IJobContainer container,
            IIntercom intercom,
            ILogger<StartOperationJob> logger)
        //IDbContextFactory<EdmContext> contextFactory)
        {
            OperationService = operationService;
            ProfileService = profileService;
            JobManager = container;
            Intercom = intercom;
            Logger = logger;
        }

        public override bool Init()
        {
            // TODO move device init here to check failures before start and notify user
            return true;
        }

        public override async Task<object> ExecuteAsync()
        {
            // Adjust operation start time
            // TODO Move all device initializations to Init() method, run jobs from here.
            //      RemoteJobs service must implement separate methods: first for create and init job, second must launch it
            // TODO Make delay value configurable
            var startTime = DateTime.UtcNow.AddSeconds(2); // 1 seconds should be enough to init all devices before start
            startTime = startTime > Parameters.StartAt ? startTime : Parameters.StartAt;
            var running = new List<(string url, IJob job)>();
            var audits = new List<IJob>();
            // Launch execution result storage
            var storeChannel = $"Operation-{Parameters.Operation}";
            var auditChannel = $"{storeChannel}-audit";
            var parametersChannel = $"{storeChannel}-parameters";
            var storageJob = new StoreOperationRecordsJob
            {
                JobParameters = new StoreOperationRecordsJobParameters 
                { 
                    Operation = Parameters.Operation,
                    Channel = storeChannel, 
                    AuditChannel = auditChannel,
                    ParametersChannel = parametersChannel
                }
            };
            await JobManager.Execute(storageJob);
            var operation = await OperationService.Get(Parameters.Operation);
            // Launch devices
            var devices = await OperationService.GetOperationDevices(Parameters.Operation);

            // TODO refactor starting device in parallel
            foreach (var operationHostDevice in devices)
            {
                // Launch audits
                // TODO Launch audits in parallel
                var deviceAudits = await ProfileService.GetAudits(operationHostDevice.ProfileId);
                foreach (var audit in deviceAudits)
                {
                    var auditParams = new StartAuditJobParameters
                    {
                        Audit = audit.Id,
                        Device = operationHostDevice.Id,
                        Operation = Parameters.Operation,
                        Channel = auditChannel,
                        ParametersChannel = parametersChannel,
                        StartAt = startTime
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
                    Operation = Parameters.Operation,
                    OperationHostDevice = operationHostDevice.Id,
                    StartAt = startTime,
                    Profile = operationHostDevice.Profile.TextJson,
                    Profiler = operationHostDevice.Profile.ProfilerGuid,
                    StoreChannel = storeChannel,
                    ParametersChannel = parametersChannel,
                    InputParameters = operationHostDevice.Profile.Input,
                    OutputParameters = operationHostDevice.Profile.Output,
                    InitialParameters = operation.Parameters
                };
                var url = $"{operationHostDevice.HostDevice.Host.Url}:{operationHostDevice.HostDevice.Host.Port}";
                var deviceJob = new StartDeviceJob { JobParameters = deviceParams };
                running.Add((url, deviceJob));
                // TODO check response for validity
                var response = await deviceJob.Execute(url);

            }

            int count;
            do
            {
                count = 0;
                await Task.Delay(5000, CancellationToken)
                    .ContinueWith(t => { }); // Avoid Canceled exception
                foreach (var (url, job) in running)
                {
                    IJob check = CancellationToken.IsCancellationRequested ? new StopJob(job) : new CheckJob(job);
                    var parameter = new
                    {
                        Job = job.Name,
                        ((StartDeviceJobParameters)job.JobParameters).OperationHostDevice,
                        ((StartDeviceJobParameters)job.JobParameters).Driver
                    };
                    var response = await check.Execute(url, parameter)
                        .ContinueWith(t =>
                        {
                            if (t.Status == TaskStatus.Faulted)
                            {
                                Logger.LogWarning("Operation {Id} {OpName} cannot check child job {Job} on {host}.\n{Error}", 
                                    operation.Id, operation.Name, job.Name, url, t.Exception.GetMeaningfulMessage() );
                                return new JobResponse { Status = "Faulted", Message = t.Exception.GetMeaningfulMessage() };
                            }

                            return t.Result;
                        });
                    if (response.Status != "Ok" || !Enum.TryParse(response.Message, out TaskStatus jobStatus)) 
                        continue;
                    
                    if (jobStatus is TaskStatus.Running 
                        or TaskStatus.WaitingForActivation 
                        or TaskStatus.WaitingToRun 
                        or TaskStatus.WaitingForChildrenToComplete)
                    {
                        continue;
                    }

                    count++;
                }
            } while (count < running.Count && !CancellationToken.IsCancellationRequested);

            // Stop audits and storage
            await Intercom.Publish(parametersChannel, KeyValuePair.Create("Stop", true));
            await Task.Delay(1000);
            if (CancellationToken.IsCancellationRequested)
            {
                await OperationService.StopOperation(Parameters.Operation);
            }
            else
            {
                await OperationService.CompleteOperation(Parameters.Operation);
            }

            return "Ok";
        }

        public int GetOperationId() => Parameters.Operation;
    }

    public class StartOperationJobParameters : IJobParameters
    {
        [JobParameter(Required = true)]
        public int Operation { get; set; }
        public DateTime StartAt { get; set; } = DateTime.UtcNow.AddSeconds(5);
    }

}


