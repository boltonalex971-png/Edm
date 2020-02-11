using System;
using System.Collections.Generic;
using System.Linq;
//using System.Text.Json;
using System.Threading.Tasks;
using AutoMapper;
using Grpc.Core;
using Microprojects.Edm;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;

namespace Edm.WebApi
{
    public class EdmCommandService : CommandExecutor.CommandExecutorBase
    {
        private readonly ILogger<EdmCommandService> _logger;
        public EdmCommandService(ILogger<EdmCommandService> logger)
        {
            _logger = logger;
        }

        public async override Task<CommandResponse> ExecuteCommand(CommandParams request, ServerCallContext context)
        {
            var param = JsonConvert.DeserializeObject<Params>(request.Params);
            var parameters = new CommandData { Command = request.Command, Params = param };
            var result = await CommandManager.GetInstance().Execute(parameters);

            return new CommandResponse
            {
                Status = result.Status,
                Message = result.Message,
                Response = result.Response
            };
        }

        public override Task<AvailableTasks> GetAvailableTasks(AvalableTaskParams request, ServerCallContext context)
        {
            var result = CommandManager.GetInstance().GetAvailableTasks();
            var tasks = new AvailableTasks();
            tasks.Tasks.AddRange(result.Select(r => new AvailableTasks.Types.Task { Pid = r.Pid ?? string.Empty, Status = r.Status ?? string.Empty, TaskName = r.TaskName, Type = r.Type }));
            return Task.FromResult(tasks);
        }
    }
}
