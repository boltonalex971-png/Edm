using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microprojects.Edm.Models;
using Microprojects.Edm.Plugins;
using Microprojects.Edm.Ui.Technologies.Contracts;
using Microprojects.Edm.Ui.Technologies.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;

namespace Microprojects.Edm.Ui.Technologies.Controllers
{
    [ApiController]
    [Route("api/technologies/[controller]")]
    public class OperationsController : ControllerBase
    {
        private readonly ILogger<OperationsController> _logger;
        private readonly IOperationService _operationService;
        private readonly ISettingService _settingService;
        private readonly IPluginContainer _plugins;

        private Func<Guid, string> OperationProcessSettingName = (processId) => $"{nameof(Process).ToLower()}-{processId}";

        public OperationsController(
            ILogger<OperationsController> logger,
            IOperationService operationService,
            ISettingService settingService,
            IPluginContainer plugins)
        {
            _logger = logger;
            _operationService = operationService;
            _settingService = settingService;
            _plugins = plugins;
        }

        [HttpGet("{id:guid}")]
        public async Task<Operation> Get(Guid id) => await _operationService.Get(id);

        [HttpPost("{id:guid}")]
        public async Task<Operation> Add(Guid id) => await _operationService.Copy(id);

        [HttpPost]
        public async Task<Operation> Create(Operation model) => await _operationService.Create(model);

        [HttpGet("launch")]
        public async Task<OperationLaunchResponse> Launch([FromQuery] string processUid, [FromQuery] string workbenchUid)
        {
            var response = new OperationLaunchResponse();
            try
            {
                var (operation, process) = await _operationService.Launch(processUid, workbenchUid);
                var basePath = $"{Request.Scheme}://{Request.Host}";
                var apiPath = $"{basePath}/{Request.PathBase}api/operations";
                var appPath = _plugins.GetMonitor(process.OperationGuid).Homepage;
                response.Id = operation.Id;
                response.UiUrl = $"{basePath}/{appPath}?id={operation.Id}";
                response.StatusUrl = $"{apiPath}/{operation.Id}/status";
                response.ValidityUrl = $"{apiPath}/{operation.Id}/result";
            }
            catch (Exception e)
            {
                response.Error = e.Message;
            }

            return response;
        }

        [HttpPost("{id:guid}/start")]
        public async Task<Operation> Start(Guid id, [FromBody] DateTimeOffset? startAt)
        {
            var startTime = startAt?.UtcDateTime ?? DateTime.UtcNow;
            return await _operationService.Start(id, startTime);
        }

        [HttpPost("{id:guid}/stop")]
        public async Task<Operation> Stop(Guid id) => await _operationService.Stop(id);

        [HttpPost("{id:guid}/complete")]
        public async Task<Operation> Complete(Guid id) => await _operationService.CompleteOperation(id);

        [HttpGet("{id:guid}/status")]
        public async Task<OperationStatus> Status(Guid id) => await _operationService.Status(id);

        [HttpGet("{id:guid}/result")]
        public async Task<OperationResult> Result(Guid id)
        {
            var status = await _operationService.Status(id);
            return new OperationResult { IsValid = status.IsValid, Message = status.Message };
        }

        [HttpGet("running")]
        public async Task<IEnumerable<OperationViewModel>> GetRunningOperations()
        {
            var ops = (await _operationService.Get(
                o => o.Completed == null && o.Cancelled == null,
                o => o.WorkplaceProcess.Process)).ToList();
            var uncompleted = ops.Select(o => o.ToViewModel()).ToList();
            foreach (var op in uncompleted.Where(o => o.State == OperationState.InProgress))
            {
                op.State = (await _operationService.GetStatus(ops.First(o => o.Id == op.Id))).State;
            }

            return uncompleted.OrderByDescending(o => o.Created);
        }

        [HttpGet("today")]
        public async Task<IEnumerable<OperationViewModel>> GetTodayOperations()
        {
            var ops = await _operationService.Get(
                o => o.Completed > DateTime.UtcNow.Date || o.Cancelled > DateTime.UtcNow.Date,
                o => o.WorkplaceProcess.Process);
            return ops.Select(o => o.ToViewModel()).OrderByDescending(o => o.Completed ?? o.Cancelled);
        }

        [HttpGet("week")]
        public async Task<IEnumerable<OperationViewModel>> GetWeekOperations()
        {
            var ops = await _operationService.Get(
                o => o.Completed > DateTime.UtcNow.Date.AddDays(-6) || o.Cancelled > DateTime.UtcNow.Date.AddDays(-6),
                o => o.WorkplaceProcess.Process);
            return ops.Select(o => o.ToViewModel()).OrderByDescending(o => o.Completed ?? o.Cancelled);
        }

        [HttpGet("{operationId:guid}/records")]
        public async Task<IEnumerable<Record>> GetOperationRecords(Guid operationId, [FromQuery] Guid? lastRecordId) =>
            await _operationService.GetRecords(operationId, lastRecordId);

        [HttpGet("{operationId:guid}/criteria")]
        public async Task<IEnumerable<OperationCriterionModel>> GetOperationCriteria(Guid operationId)
        {
            var criteria = await _operationService.GetCriteria(operationId);
            return criteria.Select(c => c.ToModel()).ToList();
        }

        [HttpGet("{operationId:guid}/criterion")]
        public async Task<IEnumerable<OperationCriterionModel>> GetOperationCriterion(Guid operationId, [FromQuery] Guid? lastId)
        {
            var criterion = await _operationService.GetCriterion(operationId, lastId);
            return criterion.Select(c => c.ToModel()).ToList();
        }

        [HttpGet("{id:guid}/devices")]
        public async Task<IEnumerable<OperationHostDevice>> GetOperationDevices(Guid id) =>
            await _operationService.GetOperationDevices(id);

        [HttpGet("{id:guid}/process")]
        public async Task<Process> GetProcessByOperationId(Guid id)
        {
            var process =
                (await _operationService.Get(o => o.Id == id, o => o.WorkplaceProcess.Process))
                .FirstOrDefault()?.WorkplaceProcess?.Process ??
                (await _operationService.Get(o => o.Id == id, o => o.Workbench.WorkplaceProcess.Process))
                .FirstOrDefault()?.Workbench?.WorkplaceProcess.Process;
            return process;
        }

        [HttpGet("{id:guid}/processInfo")]
        public async Task<ProcessInfo> GetProcessInfo(Guid id)
        {
            var operation = await _operationService.Get(id, o => o.WorkplaceProcess.Process);
            var devices = await _operationService.GetOperationDevices(id);
            var profileParams = devices
                .SelectMany(d => _plugins.GetProfile(d.Profile.ProfilerGuid).GetParameters(d.Profile.TextJson));
            var parameters = devices
                .SelectMany(d => JsonConvert.DeserializeObject<IEnumerable<string>>(d.Profile.Output ?? "[]"));
            var settings = await _settingService.Get(
                operation.WorkplaceProcess.Process.OperationGuid,
                OperationProcessSettingName(operation.WorkplaceProcess.ProcessId));
            return new ProcessInfo
            {
                Id = operation.WorkplaceProcess.ProcessId,
                Name = operation.WorkplaceProcess.Process.Name,
                Description = operation.WorkplaceProcess.Process.Description,
                AppGuid = operation.WorkplaceProcess.Process.OperationGuid,
                Parameters = parameters.Concat(profileParams).Distinct(),
                Settings = settings
            };
        }

        [HttpGet("{id:guid}/info")]
        public async Task<OperationInfo> GetOperationInfo(Guid id)
        {
            var status = await Status(id);
            var process = await GetProcessInfo(id);
            var devices = await GetOperationDevices(id);
            var criteria = await GetOperationCriteria(id);
            var records = await GetOperationRecords(id, null);
            return new OperationInfo
            {
                Id = status.Id,
                State = status.State,
                StateTimestamp = status.StateTimestamp,
                Error = status.Error,
                IsValid = status.IsValid,
                Message = status.Message,
                Process = process,
                Devices = devices,
                Criteria = criteria,
                Records = records,
            };
        }

        [HttpPut("{id:guid}/settings")]
        public async Task<object> SaveOperationSettings(Guid id, [FromBody] object settings)
        {
            var operation = await _operationService.Get(id, o => o.WorkplaceProcess.Process);
            return await _settingService.Set(
                operation.WorkplaceProcess.Process.OperationGuid,
                OperationProcessSettingName(operation.WorkplaceProcess.ProcessId),
                JsonConvert.SerializeObject(settings));
        }
    }
}
