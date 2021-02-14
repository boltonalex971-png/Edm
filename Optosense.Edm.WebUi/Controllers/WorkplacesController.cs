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

        [HttpGet("processes/{wpProcId:int}")]
        public async Task<WorkplaceProcessModel> GetWorplaceProcess(int wpProcId)
        {
            var process = await _workplaceService.GetWorkplaceProcess(wpProcId);
            return _mapper.Map<WorkplaceProcessModel>(process);
        }

        [HttpGet("processes/{wpProcId:int}/workbenches")]
        public async Task<IEnumerable<WorkbenchViewModel>> GetWorkbenches(int wpProcId)
        {
            var wbs = await _workplaceService.GetWorkbenches(wpProcId);
            var result = _mapper.Map<IEnumerable<WorkbenchViewModel>>(wbs);
            return result;
        }

        [HttpPost("processes/{wpProcId:int}/workbenches")]
        public async Task<WorkbenchViewModel> AddWorkbench(int wpProcId, WorkbenchViewModel model)
        {
            var wb = _mapper.Map<Workbench>(model);
            wb.Id = 0;
            wb.WorkplaceProcessId = wpProcId;
            wb = await _workplaceService.SaveWorkbench(wb);
            var result = _mapper.Map<WorkbenchViewModel>(wb);
            return result;
        }

        [HttpGet("processes/workbenches/{id:int}")]
        public async Task<WorkbenchViewModel> GetWorkbench(int id)
        {
            var result = await _workplaceService.GetWorkbench(id);
            return _mapper.Map<WorkbenchViewModel>(result);
        }

        [HttpPut("processes/workbenches/{id:int}")]
        public async Task<WorkbenchViewModel> SaveWorkbench(int id, WorkbenchViewModel model)
        {
            var wb = _mapper.Map<Workbench>(model);
            var result = await _workplaceService.SaveWorkbench(wb);
            return _mapper.Map<WorkbenchViewModel>(result);
        }

        [HttpDelete("processes/{procId:int}/workbenches/{id:int}")]
        public async Task<WorkbenchViewModel> DeleteWorkbench(int id)
        {
            var wb = await _workplaceService.DeleteWorkbench(id);
            var result = _mapper.Map<WorkbenchViewModel>(wb);
            return result;
        }

        [HttpGet("processes/workbenches/{id:int}/devices")]
        public async Task<IEnumerable<WorkbenchDeviceConfigViewModel>> GetWorkbenchDevices(int id)
        {
            var devices = await _workplaceService.GetWorkbenchDevices(id);
            var result = _mapper.Map<IEnumerable<WorkbenchDeviceConfigViewModel>>(devices);
            return result;
        }

        [HttpPost("processes/workbenches/{id:int}/devices")]
        public async Task<WorkbenchDeviceConfigViewModel> GetWorkbenchDevices(int id, WorkbenchDeviceConfigViewModel model)
        {
            var device = _mapper.Map<WorkbenchWorkplaceHostDevice>(model);
            device.Id = 0;
            device.WorkbenchId = id;
            var result = await _workplaceService.SaveWorkbenchDevice(device);
            return _mapper.Map<WorkbenchDeviceConfigViewModel>(result);
        }

        [HttpDelete("processes/workbenches/{wbId:int}/devices/{id:int}")]
        public async Task<WorkbenchDeviceConfigViewModel> DeleteWorkbenchDevice(int id)
        {
            var device = await _workplaceService.DeleteWorkbenchDevice(id);
            var result = _mapper.Map<WorkbenchDeviceConfigViewModel>(device);
            return result;
        }

        [HttpGet("processes/workbenches/devices/{id:int}")]
        public async Task<WorkbenchDeviceConfigViewModel> GetWorkbenchDevice(int id)
        {
            var device = await _workplaceService.GetWorkbenchDevice(id);
            var result = _mapper.Map<WorkbenchDeviceConfigViewModel>(device);
            return result;
        }

        #endregion
    }
}
