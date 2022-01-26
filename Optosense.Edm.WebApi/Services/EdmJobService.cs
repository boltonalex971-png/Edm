using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
//using System.Text.Json;
using System.Threading.Tasks;
using AutoMapper;
using Grpc.Core;
using Microprojects.Edm;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Optosense.Edm.Infrastructure.Protos;

namespace Optosense.Edm.WebApi.Services
{
    public class EdmJobService : JobExecutor.JobExecutorBase, IHostedService
    {
        private readonly ILogger<EdmJobService> _logger;
        private readonly IJobContainer _jobManager;

        public EdmJobService(ILogger<EdmJobService> logger, IJobContainer commandManager)
        {
            _logger = logger;
            _jobManager = commandManager;
        }

        public async override Task<JobResponse> ExecuteJob(JobParams request, ServerCallContext context)
        {
            //var param = JsonConvert.DeserializeObject<Params>(request.Params);
            var parameters = new JobData { Job = request.Job, Params = request.Params };
            var result = await _jobManager.ExecuteAsync(parameters);

            return new JobResponse
            {
                Status = result.Status ?? string.Empty,
                Message = result.Message ?? string.Empty,
                Response = result.Response ?? string.Empty
            };
        }

        public override Task<AvailableTasks> GetAvailableTasks(AvalableTaskParams request, ServerCallContext context)
        {
            var result = _jobManager.GetAvailableTasks();
            var tasks = new AvailableTasks();
            tasks.Tasks.AddRange(result.Select(r => new AvailableTasks.Types.Task { Pid = r.Pid ?? string.Empty, Status = r.Status ?? string.Empty, TaskName = r.Name, Type = r.Type }));
            return Task.FromResult(tasks);
        }

        public Task StartAsync(CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }
    }
}
