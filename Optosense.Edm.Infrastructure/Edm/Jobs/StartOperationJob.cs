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
using Microsoft.Extensions.DependencyInjection;
using Optosense.Edm.Infrastructure.Protos;

namespace Optosense.Edm.Jobs
{
    [Job(Name = "StartOperation", Lifetime = JobLifetime.LongRunning, Parameters = typeof(StartOperationJobParameters))]
    public class StartOperationJob : BaseJob, IKnowOperation, INeedServiceScope
    {
        public IServiceScope ServiceScope { get; set; }

        protected StartOperationJobParameters Parameters => (StartOperationJobParameters)JobParameters;
        protected IOperationService OperationService { get; init; }
        protected IProfileService ProfileService { get; init; }
        protected IJobContainer JobManager { get; init; }
        protected IIntercom Intercom { get; init; }
        protected ILogger<StartOperationJob> Logger { get; init; }
        protected IServiceProvider ServiceProvider { get; init; }
        protected string ParametersChannel { get; set; }
        
        private List<(string url, IJob job)> _devices = [];
        private List<IJob> _audits = [];
        private IJob _storageJob;

        public StartOperationJob() { }
        public StartOperationJob(
            IOperationService operationService,
            IProfileService profileService,
            IJobContainer container,
            IIntercom intercom,
            ILogger<StartOperationJob> logger,
            IServiceProvider serviceProvider)
        {
            OperationService = operationService;
            ProfileService = profileService;
            JobManager = container;
            Intercom = intercom;
            Logger = logger;
            ServiceProvider = serviceProvider; 
        }

        public override async Task<bool> InitAsync()
        {
            // Adjust operation start time
            // TODO Move all device initializations to Init() method, run jobs from here.
            //      RemoteJobs service must implement separate methods: first for create and init job, second must launch it
            // TODO Make delay value configurable
            var startTime = DateTime.UtcNow.AddSeconds(2); // 1 seconds should be enough to init all devices before start
            startTime = startTime > Parameters.StartAt ? startTime : Parameters.StartAt;
            // Prepare execution result storage
            var storeChannel = $"Operation-{Parameters.Operation}";
            var auditChannel = $"{storeChannel}-audit";
            ParametersChannel = $"{storeChannel}-parameters";
            var storeJobParameters = new StoreOperationRecordsJobParameters
            {
                Operation = Parameters.Operation,
                Channel = storeChannel,
                AuditChannel = auditChannel,
                ParametersChannel = ParametersChannel
            };
            _storageJob = await JobManager.GetJobAsync<StoreOperationRecordsJob>(ServiceScope, storeJobParameters);
            
            // Prepare devices
            var devices = await OperationService.GetOperationDevices(Parameters.Operation);

            // TODO refactor starting device in parallel
            foreach (var operationHostDevice in devices)
            {
                // Prepare audits
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
                        ParametersChannel = ParametersChannel,
                        StartAt = startTime
                    };
                    var auditJob = await JobManager.GetJobAsync<StartAuditJob>(ServiceScope, auditParams); 
                    _audits.Add(auditJob);
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
                    ParametersChannel = ParametersChannel,
                    InputParameters = operationHostDevice.Profile.Input,
                    OutputParameters = operationHostDevice.Profile.Output
                };
                var url = $"{operationHostDevice.HostDevice.Host.Url}:{operationHostDevice.HostDevice.Host.Port}";
                var deviceJob = new StartDeviceJob { JobParameters = deviceParams };
                _devices.Add((url, deviceJob));
                // TODO check response for validity
                var response = await deviceJob.Execute(url);
                if (response.Status != JobStatus.SUCCESS)
                {
                    throw new EdmException($"{deviceJob.Name} failed: {response.Message}");
                }
            }

            return true;
        }

        public override async Task<object> ExecuteAsync()
        {
            foreach (var audit in _audits)
            {
                await JobManager.ExecuteAsync(audit);
            }
            
            await JobManager.ExecuteAsync(_storageJob);
            
            var operation = await OperationService.Get(Parameters.Operation);
            // Push operation input parameters
            foreach (var p in JsonConvert.DeserializeObject<Dictionary<string, object>>(
                         operation.Parameters ?? "{}"))
            {
                await Intercom.Publish(ParametersChannel, p);
            }

            int count;
            do
            {
                count = 0;
                await Task.Delay(5000, CancellationToken)
                    .ContinueWith(t => { }); // Avoid Canceled exception
                foreach (var (url, job) in _devices)
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
            } while (count < _devices.Count && !CancellationToken.IsCancellationRequested);

            // Stop audits and storage
            await Intercom.Publish(ParametersChannel, KeyValuePair.Create("Stop", true));
            await Task.Delay(1000);
            if (CancellationToken.IsCancellationRequested)
            {
                await OperationService.StopOperation(Parameters.Operation);
            }
            else
            {
                await OperationService.CompleteOperation(Parameters.Operation);
            }

            return JobStatus.SUCCESS;
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


