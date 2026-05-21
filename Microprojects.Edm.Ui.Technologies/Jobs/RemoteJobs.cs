using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Grpc.Net.Client;
using Microprojects.Edm.Jobs;
using Newtonsoft.Json;
using Microprojects.Edm.Infrastructure;
using Microprojects.Edm.Grpc;
using Microprojects.Edm.Jobs;

namespace Microprojects.Edm.Ui.Technologies.Jobs
{
    public class RemoteJobs : IRemoteJobs
    {
        private readonly IJobContainer _jobs;
        private readonly IGrpcJobExecutor _grpcExecutor;

        public RemoteJobs(IJobContainer jobs, IGrpcJobExecutor grpcExecutor)
        {
            _jobs = jobs;
            _grpcExecutor = grpcExecutor;
        }

        public async Task<string> Execute(string host, IJob job)
        {
            if (job == null)
            {
                throw new Exception("Job name and parameters cannot be null");
            }

            var response = await _grpcExecutor.ExecuteAsync(job, host);
            return response.Response;
        }

        public async Task<string> StartDevice(
            int linkId,
            string url,
            dynamic options,
            string profile,
            Guid driverGuid,
            DateTime startAt)
        {
            var deviceParams = new StartDeviceJobParameters
            {
                Driver = driverGuid,
                DriverOptions = options,
                OperationHostDevice = linkId,
                StartAt = startAt,
                Profile = profile
            };
            var deviceJob = new StartDeviceJob { JobParameters = deviceParams };
            var response = await _grpcExecutor.ExecuteAsync(deviceJob, url);

            return response.Response;
        }

        public async Task<ResponseData> StartOperation(int operationId, DateTime startAt)
        {
            var parameters = new StartOperationJobParameters
            {
                Operation = operationId,
                StartAt = startAt
            };
            var response = await _jobs.ExecuteAsync(
                new JobData
                {
                    Job = "StartOperation",
                    Params = $@"{JsonConvert.SerializeObject(parameters)}"
                });
            
            return response;
        }

        public async Task<string> StartTestOperation(int operationId, DateTime startAt)
        {
            var parameters = new StartOperationJobParameters
            {
                Operation = operationId,
                StartAt = startAt
            };
            var response = await _jobs.ExecuteAsync(
                new JobData
                {
                    Job = "StartOperation",
                    Params = $@"{JsonConvert.SerializeObject(parameters)}"
                });
            return response.Response;
        }

        public async Task<bool> CheckOperationRun(int operationId)
        {
            var job = new CheckJob(new StartOperationJob() 
            { 
                JobParameters = new StartOperationJobParameters 
                { 
                    Operation = operationId
                }
            });

            var response = await _jobs.Execute(job);
            if (response.Status == JobStatus.SUCCESS && Enum.TryParse(response.Message, out TaskStatus jobStatus))
            {
                return jobStatus is TaskStatus.Running 
                    or TaskStatus.WaitingForActivation 
                    or TaskStatus.WaitingToRun 
                    or TaskStatus.WaitingForChildrenToComplete;
            }

            return false;
        }

        public async Task<string> CancelOperation(int operationId)
        {
            var response = await _jobs.ExecuteAsync(new JobData
            {
                Job = "Stop",
                Params = JsonConvert.SerializeObject(new { Job = "StartOperation", Operation = operationId})
            });
            if (response.Status != "Ok")
            {
                throw new EdmException(
                    "Technologies.Operation.RemoteJobFailed",
                    new Dictionary<string, object> { ["message"] = response.Message },
                    response.Message);
            }
            return response.Response;
        }
    }
}
