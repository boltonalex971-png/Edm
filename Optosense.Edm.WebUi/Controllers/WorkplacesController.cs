using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Optosense.Edm.Core.Contracts;
using Optosense.Edm.Domain.Models;
using Optosense.Edm.Webui.Models;

namespace Optosense.Edm.WebUi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WorkplacesController : ControllerBase
    {
        private readonly ILogger<WorkplacesController> _logger;
        private readonly IMapper _mapper;
        private readonly IWorkplaceService _workplaceService;

        public WorkplacesController(ILogger<WorkplacesController> logger, IMapper mapper, IWorkplaceService workplaceService)
        {
            _logger = logger;
            _mapper = mapper;
            _workplaceService = workplaceService;
        }

        [HttpGet]
        public async Task<IEnumerable<Workplace>> Get()
        {
            return await _workplaceService.GetAll();
        }

        [HttpGet("{id:int}")]
        public async Task<Workplace> GetById(int id)
        {
            if (id > 0)
            {
                return await _workplaceService.Get(id);
            }
            else
            {
                return new Workplace
                {
                    Name = string.Empty,
                    Description = string.Empty,
                    IsActive = true
                };
            }
        }

        [HttpPut("{id:int}")]
        public async Task<Workplace> Save(int id, [FromBody] Workplace workplace)
        {
            if (id != workplace.Id)
            {
                throw new Exception("Process id is ambiguous");
            }
            var result = await _workplaceService.Save(workplace);
            return result;
        }

        [HttpDelete("{id:int}")]
        public async Task<Workplace> Delete(int id)
        {
            var process = await _workplaceService.Delete(id);
            return process;
        }

        [HttpPost]
        public async Task<Workplace> Create([FromBody] Workplace workplace)
        {
            workplace.Id = 0;
            var result = await _workplaceService.Save(workplace);
            return result;
        }

        #region devices
        [HttpGet("{id:int}/devices")]
        public async Task<IEnumerable<WorkplaceHostDeviceModel>> GetDevices(int id)
        {
            var devices = await _workplaceService.GetDevices(id);
            return _mapper.Map<IEnumerable<WorkplaceHostDeviceModel>>(devices);
        }

        [HttpPost("{id:int}/devices")]
        public async Task<WorkplaceHostDeviceModel> AttachHostDevice(int id, WorkplaceHostDeviceModel model)
        {
            var wpHostDevice = _mapper.Map<WorkplaceHostDevice>(model);
            wpHostDevice.WorkplaceId = id;
            var device = await _workplaceService.AttachDevice(wpHostDevice);
            return _mapper.Map<WorkplaceHostDeviceModel>(device);
        }

        [HttpDelete("{id:int}/devices/{devId:int}")]
        public async Task<bool> DetachHostDevice(int id, int devId)
        {
            var wasDetached = await _workplaceService.DetachDevice(id, devId);
            return wasDetached;
        }

        [HttpGet("devices")]
        public async Task<IEnumerable<IdNameModel>> GetAvailableHostDevices(DeviceType? type)
        {
            var hostDevices = await _workplaceService.GetAvailableHostDevices();
            if (type != null) {
                hostDevices = hostDevices.Where(hd => hd.Device.EnvType == type);
            }
            return _mapper.Map<IEnumerable<IdNameModel>>(hostDevices);
        }

        #endregion

        #region processes
        [HttpGet("{id:int}/processes")]
        public async Task<IEnumerable<WorkplaceProcessModel>> GetProcess(int id)
        {
            var processes = await _workplaceService.GetProcesses(id);
            return _mapper.Map<IEnumerable<WorkplaceProcessModel>>(processes);
        }

        [HttpPost("{id:int}/processes")]
        public async Task<WorkplaceProcessModel> AttachProcess(int id, WorkplaceProcessModel model)
        {
            var wpProcess = _mapper.Map<WorkplaceProcess>(model);
            wpProcess.WorkplaceId = id;
            var process = await _workplaceService.AttachProcess(wpProcess);
            return _mapper.Map<WorkplaceProcessModel>(process);
        }

        [HttpDelete("{id:int}/processes/{procId:int}")]
        public async Task<bool> DetachProcess(int id, int procId)
        {
            var wasDetached = await _workplaceService.DetachProcess(id, procId);
            return wasDetached;
        }

        [HttpGet("processes")]
        public async Task<IEnumerable<IdNameModel>> GetAvailableProcesses()
        {
            var processes = await _workplaceService.GetAvailableProcesses();
            return _mapper.Map<IEnumerable<IdNameModel>>(processes);
        }
        #endregion
    }
}
