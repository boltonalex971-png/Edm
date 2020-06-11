using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Optosense.Edm.Core.Contracts;
using Optosense.Edm.Domain.Models;

namespace Optosense.Edm.WebUi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProcessesController : ControllerBase
    {
        private readonly ILogger<ProcessesController> _logger;
        private readonly IProcessService _processService;

        public ProcessesController(ILogger<ProcessesController> logger, IProcessService processService)
        {
            _logger = logger;
            _processService = processService;
        }

        [HttpGet]
        public async Task<IEnumerable<Process>> Get()
        {
            return await _processService.GetAll();
        }

        [HttpGet("{id:int}")]
        public async Task<Process> GetById(int id)
        {
            if (id > 0)
            {
                return await _processService.Get(id);
            }
            else
            {
                return new Process 
                { 
                    Name = string.Empty,
                    Description = string.Empty,
                    IsActive = true
                };
            }
        }

        [HttpPut("{id:int}")]
        public async Task<Process> Save(int id, [FromBody] Process process)
        {
            if (id != process.Id)
            {
                throw new Exception("Process id is ambiguous");
            }
            var result = await _processService.Save(process);
            return result;
        }

        [HttpDelete("{id:int}")]
        public async Task<Process> DeleteProcess(int id)
        {
            var process = await _processService.Delete(id);
            return process;
        }

        [HttpPost]
        public async Task<Process> Create([FromBody] Process process)
        {
            process.Id = 0;
            var result = await _processService.Save(process);
            return result;
        }
    }
}
