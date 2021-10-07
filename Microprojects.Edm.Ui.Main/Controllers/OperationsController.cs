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

namespace Microprojects.Edm.Ui.Main.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OperationsController : ControllerBase
    {
        private ILogger<OperationsController> _logger;
        private readonly IMapper _mapper;
        private IOperationService _operationService;

        public OperationsController(ILogger<OperationsController> logger, IMapper mapper, IOperationService operationService)
        {
            _logger = logger;
            _mapper = mapper;
            _operationService = operationService;
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
        public async Task<JsonResult> Result(Guid operationId)
        {
            return await Task.FromResult(new JsonResult(new[]
            {
                new { Id = Guid.NewGuid(), Status = "Ok" },
                new { Id = Guid.NewGuid(), Status = "Ok" },
                new { Id = Guid.NewGuid(), Status = "Broken" },
                new { Id = Guid.NewGuid(), Status = "Failed" },
                new { Id = Guid.NewGuid(), Status = "Failed" },
                new { Id = Guid.NewGuid(), Status = "Ok" }
            }));
        }

        [HttpGet("running")]
        public async Task<IEnumerable<OperationViewModel>> GetRunningOperations()
        {
            var ops = await _operationService.Get(o => o.Completed == null, o => o.Workbench.WorkplaceProcess.Process);
            return _mapper.Map<IEnumerable<OperationViewModel>>(ops);
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
            var op = (await _operationService.Get(o => o.Id == id, o => o.Workbench.WorkplaceProcess.Process))
                .FirstOrDefault();
            return op.Workbench.WorkplaceProcess.Process;
        }
    }
}