using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Microprojects.Edm;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Optosense.Edm.Core.Contracts;
using Optosense.Edm.Core.Models;
using Optosense.Edm.Domain.Models;
using Microprojects.Edm.Ui.Main.Models;
using Optosense.Edm.Plugins;
using Microprojects.Edm.Jobs;
using Newtonsoft.Json;
using Google.Protobuf.WellKnownTypes;
using System.Reflection;

namespace Microprojects.Edm.Ui.Main.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OperationsController : ControllerBase
    {
        private ILogger<OperationsController> _logger;
        private readonly IMapper _mapper;
        private IOperationService _operationService;
        private ISettingService _settingService;
        private readonly IPluginContainer _plugins;

        private Func<int, string> OperationProcessSettingName = (processId) => $"{nameof(Process).ToLower()}-{processId}";

        public OperationsController(
            ILogger<OperationsController> logger,
            IMapper mapper,
            IOperationService operationService,
            ISettingService settingService,
            IPluginContainer plugins)
        {
            _logger = logger;
            _mapper = mapper;
            _operationService = operationService;
            _settingService = settingService;
            _plugins = plugins;
        }

        [HttpGet("{id:int}")]
        public async Task<Operation> Get(int id)
        {
            var operation = await _operationService.Get(id);
            return operation;
        }

        [HttpPost]
        public async Task<Operation> Create(Operation model)
        {
            var operation = await _operationService.Create(_mapper.Map<Operation>(model));
            //await _operationService.Start(operation.Id);
            return operation;
        }

        /// <summary>
        /// Used to define an appropriate workbench for selected process to create an operation. Required 
        /// for outer systems integrations.
        /// </summary>
        /// <param name="processUid">string representing process UID, common for integrated systems</param>
        /// <param name="workbechUid">string representing workbench UID, common for integrated systems</param>
        /// <returns></returns>
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

        [HttpPost("{id:int}/start")]
        public async Task<Operation> Start(int id, [FromBody] DateTime? startAt)
        {
            var operation = await _operationService.Start(id, (startAt ?? DateTime.Now).ToLocalTime());
            return operation;
        }

        [HttpPost("{id:int}/stop")]
        public async Task<Operation> Stop(int id)
        {
            var operation = await _operationService.Stop(id);
            return operation;
        }

        [HttpGet("{id:int}/status")]
        public async Task<OperationStatus> Status(int id)
        {
            var status = await _operationService.Status(id);
            return status;
        }

        [HttpGet("{id:int}/result")]
        public async Task<OperationResult> Result(int id)
        {
            var status = await _operationService.Status(id);
            var result = new OperationResult
            {
                IsValid = status.IsValid,
                Message = status.Message,
            };

            return result;
        }

        [HttpGet("running")]
        public async Task<IEnumerable<OperationViewModel>> GetRunningOperations()
        {
            var ops = await _operationService.Get(
                o => o.Completed == null && o.Cancelled == null,
                o => o.WorkplaceProcess.Process);
            return _mapper.Map<IEnumerable<OperationViewModel>>(ops).OrderByDescending(o => o.Created);
        }

        [HttpGet("{operationId:int}/records")]
        public async Task<IEnumerable<Record>> GetOperationRecords(int operationId, [FromQuery] int? lastRecordId)
        {
            var recs = await _operationService.GetRecords(operationId, lastRecordId ?? 0);
            return recs;
        }

        [HttpGet("{operationId:int}/criteria")]
        public async Task<IEnumerable<OperationCriterionModel>> GetOperationCriteria(int operationId)
        {
            var criteria = await _operationService.GetCriteria(operationId);
            var result = _mapper.Map<IEnumerable<OperationCriterionModel>>(criteria);
            return result;
        }

        [HttpGet("{operationId:int}/criterion")]
        public async Task<IEnumerable<OperationCriterionModel>> GetOperationCriterion(int operationId, [FromQuery] int? lastId)
        {
            var criterion = await _operationService.GetCriterion(operationId, lastId ?? 0);
            var result = _mapper.Map<IEnumerable<OperationCriterionModel>>(criterion);
            return result;
        }
        [HttpGet("{id:int}/devices")]
        public async Task<IEnumerable<OperationHostDevice>> GetOperationDevices(int id)
        {
            var devices = await _operationService.GetOperationDevices(id);
            return devices;
        }

        [HttpGet("{id:int}/process")]
        public async Task<Process> GetProcessByOperationId(int id)
        {
            var process = 
                (await _operationService.Get(o => o.Id == id, o => o.WorkplaceProcess.Process))
                .FirstOrDefault()?.WorkplaceProcess?.Process ?? 
                (await _operationService.Get(o => o.Id == id, o => o.Workbench.WorkplaceProcess.Process))
                .FirstOrDefault()?.Workbench?.WorkplaceProcess.Process;
            return process;
        }

        [HttpGet("{id:int}/processInfo")]
        public async Task<ProcessInfo> GetProcessInfo(int id)
        {
            var operation = await _operationService
                .Get(id, o => o.WorkplaceProcess.Process);
            var devices = await _operationService.GetOperationDevices(id);
            var profileParams = devices
                .SelectMany(d => _plugins.GetProfile(d.Profile.ProfilerGuid).GetParameters(d.Profile.TextJson));
            var parameters = devices
                .SelectMany(d => JsonConvert.DeserializeObject<IEnumerable<string>>(d.Profile.Output ?? "[]"));
            var settings = await _settingService.Get(
                operation.WorkplaceProcess.Process.OperationGuid,
                OperationProcessSettingName(operation.WorkplaceProcess.ProcessId));
            var processInfo = new ProcessInfo
            {
                Id = operation.WorkplaceProcess.ProcessId,
                Name = operation.WorkplaceProcess.Process.Name,
                Description = operation.WorkplaceProcess.Process.Description,
                Parameters = parameters.Concat(profileParams).Distinct(),
                Settings = settings
            };

            return processInfo;
        }

        [HttpPut("{id:int}/settings")]
        public async Task<object> SaveOperationSettings(int id, [FromBody] object settings)
        {
            var operation = await _operationService
                .Get(id, o => o.WorkplaceProcess.Process);
            var result = await _settingService.Set(
                operation.WorkplaceProcess.Process.OperationGuid,
                OperationProcessSettingName(operation.WorkplaceProcess.ProcessId),
                JsonConvert.SerializeObject(settings));
             return result;
        }
    }
}