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
    public class EdmCommandService : CommandExecutor.CommandExecutorBase, IHostedService
    {
        private readonly ILogger<EdmCommandService> _logger;
        private readonly ICommandContainer _commandManager;

        public EdmCommandService(ILogger<EdmCommandService> logger, ICommandContainer commandManager)
        {
            _logger = logger;
            _commandManager = commandManager;
        }

        public async override Task<CommandResponse> ExecuteCommand(CommandParams request, ServerCallContext context)
        {
            //var param = JsonConvert.DeserializeObject<Params>(request.Params);
            var parameters = new CommandData { Command = request.Command, Params = request.Params };
            var result = await _commandManager.ExecuteAsync(parameters);

            return new CommandResponse
            {
                Status = result.Status ?? string.Empty,
                Message = result.Message ?? string.Empty,
                Response = result.Response ?? string.Empty
            };
        }

        public override Task<AvailableTasks> GetAvailableTasks(AvalableTaskParams request, ServerCallContext context)
        {
            var result = _commandManager.GetAvailableTasks();
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
