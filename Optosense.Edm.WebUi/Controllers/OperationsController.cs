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
using Optosense.Edm.Domain.Models;
using Optosense.Edm.WebUi.Models;

namespace Optosense.Edm.WebUi.Controllers
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
        public async Task<JsonResult> Status(Guid operationId)
        {
            return await Task.FromResult(new JsonResult(new
            {
                Status = "InProgress",
                Progress = 28,
                Estimated = TimeSpan.FromMinutes(72),
                Elapsed = TimeSpan.FromMinutes(28),
                Message = $"Operation {operationId} is in progress"
            }));
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