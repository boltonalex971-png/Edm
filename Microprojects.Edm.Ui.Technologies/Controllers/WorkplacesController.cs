using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microprojects.Edm.Controllers;
using Microprojects.Edm.Domain;
using Microprojects.Edm.Plugins;
using Microprojects.Edm.Ui.Technologies.Contracts;
using Microprojects.Edm.Ui.Technologies.Models;
using Microprojects.Edm.Ui.Technologies.Utils;
using Newtonsoft.Json;

namespace Microprojects.Edm.Ui.Technologies.Controllers
{
    [ApiController]
    [Route("api/technologies/[controller]")]
    public class WorkplacesController : AuthControllerBase
    {
        private readonly ILogger<WorkplacesController> _logger;
        private readonly IWorkplaceService _workplaceService;
        private readonly IProcessService _processService;
        private readonly IHierarchyService _hierarchyService;
        private readonly IPluginContainer _plugins;

        public WorkplacesController(
            ILogger<WorkplacesController> logger,
            IWorkplaceService workplaceService,
            IProcessService processService,
            IHierarchyService hierarchyService,
            IPluginContainer plugins, IConfiguration configuration) :
            base(configuration)
        {
            _logger = logger;
            _workplaceService = workplaceService;
            _processService = processService;
            _hierarchyService = hierarchyService;
            _plugins = plugins;
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
            // If hierarchy is not defined select default root
            workplace.HierarchyId = workplace.HierarchyId == 0 ? (await _hierarchyService.GetRoot(HierarchyType.Workplace)).Id : workplace.HierarchyId;
            var result = await _workplaceService.Save(workplace);
            return result;
        }

        [HttpPut("{id:int}/parent")]
        public async Task<Workplace> ChangeParent(int id, [FromBody] HierarchyItemViewModel parent)
        {
            var result = await _workplaceService.ChangeParent(id, parent.Id);
            return result;
        }

        [HttpGet("hierarchy")]
        public async Task<IEnumerable<HierarchyItemViewModel>> GetHierarchy()
        {
            var folders = (await _hierarchyService.GetTree(HierarchyType.Workplace, UserInfo.Groups))
                .Select(h => h.ToHierarchyItem()).ToList();
            var workplaces = (await _workplaceService.Get(w => folders.Select(f => f.Id).Contains(w.HierarchyId) && w.IsActive))
                .Select(w => w.ToHierarchyItem()).ToList();

            var tree = folders.Concat(workplaces).ToTree().ToList();
            // always expand root if just one
            if (tree.Count() == 1)
            {
                tree.First().expanded = true;
            }

            return tree;
        }

        #region devices
        [HttpGet("{id:int}/devices")]
        public async Task<IEnumerable<WorkplaceHostDeviceModel>> GetDevices(int id)
        {
            var devices = await _workplaceService.GetDevices(id);
            return devices.Select(d => d.ToModel(_plugins)).ToList();
        }

        [HttpGet("devices/{workplaceDeviceId:int}")]
        public async Task<WorkplaceHostDeviceModel> GetDevice(int workplaceDeviceId)
        {
            var device = await _workplaceService.GetDevice(workplaceDeviceId);
            return device.ToModel(_plugins);
        }

        [HttpPost("{id:int}/devices")]
        public async Task<WorkplaceHostDeviceModel> AttachHostDevice(int id, WorkplaceHostDeviceModel model)
        {
            var wpHostDevice = model.ToEntity();
            wpHostDevice.WorkplaceId = id;
            var device = await _workplaceService.AttachDevice(wpHostDevice);
            return device.ToModel();
        }

        [HttpDelete("{id:int}/devices/{devId:int}")]
        public async Task<bool> DetachHostDevice(int id, int devId)
        {
            var wasDetached = await _workplaceService.DetachDevice(id, devId);
            return wasDetached;
        }

        [HttpGet("{id:int}/devices/{profilerGuid:guid}")]
        public async Task<IEnumerable<WorkplaceHostDeviceModel>> GetProfiledDevices(int id, Guid profilerGuid)
        {
            var hostDevices = (await _workplaceService.GetDevices(id))
                .Where(d => _plugins.GetDriver(d.HostDevice.Device.DriverGuid)?.ProfileGuid == profilerGuid)
                .ToList();
            return hostDevices.Select(d => d.ToModel()).ToList();
        }

        #endregion

        #region processes

        [HttpGet("processes/allowed")]
        public async Task<IEnumerable<HierarchyItemViewModel>> GetProcessesHierarchy()
        {
            var folders = (await _hierarchyService.GetTree(HierarchyType.Workplace, UserInfo.Groups))
                .Select(h => h.ToHierarchyItem()).ToList();
            var wpProc = (await _workplaceService.GetAllowedProcesses(UserInfo.Groups)).ToList();
            var workplaces = wpProc.Select(wp => wp.Workplace).Distinct(new DomainObjectComparer<Workplace>())
                .Select(w => w.ToHierarchyItem()).ToList();
            var processes = wpProc.Select(p => p.ToHierarchyItem()).ToList();
            foreach (var w in workplaces)
            {
                w.Items = processes.Where(p => p.ParentId == w.Id).ToList();
            }
            var tree = folders.Concat(workplaces).ToDeepTree();

            return tree;
        }

        [HttpGet("devices")]
        public async Task<IEnumerable<IdNameModel>> GetAvailableHostDevices(Guid? profilerGuid)
        {
            var hostDevices = await _workplaceService.GetAvailableHostDevices();
            if (profilerGuid != null)
            {
                var guids = _plugins.GetDrivers()
                    .Where(d => d.ProfileGuid == profilerGuid)
                    .Select(d => d.Guid)
                    .ToList();
                hostDevices = hostDevices.Where(hd => guids.Contains(hd.Device.DriverGuid));
            }

            return hostDevices.Select(hd => hd.ToIdNameModel()).ToList();
        }

        [HttpGet("{id:int}/processes")]
        public async Task<IEnumerable<WorkplaceProcessModel>> GetProcesses(int id)
        {
            var processes = await _workplaceService.GetProcesses(id);
            return processes.Select(p => p.ToModel()).ToList();
        }

        [HttpPost("{id:int}/processes")]
        public async Task<WorkplaceProcessModel> AttachProcess(int id, WorkplaceProcessModel model)
        {
            var wpProcess = model.ToEntity();
            wpProcess.WorkplaceId = id;
            var process = await _workplaceService.AttachProcess(wpProcess);
            return process.ToModel();
        }

        [HttpPut("{id:int}/processes")]
        public async Task<WorkplaceProcessModel> SaveWorkplaceProcess(int id, WorkplaceProcessModel model)
        {
            var wpProcess = model.ToEntity();
            wpProcess.WorkplaceId = id;
            var result = await _workplaceService.SaveWorkplaceProcess(wpProcess);
            return result.ToModel();
        }

        [HttpDelete("{id:int}/processes/{procId:int}")]

        public async Task<bool> DetachProcess(int id, int procId)
        {
            try
            {
                var wasDetached = await _workplaceService.DetachProcess(id, procId);
                return wasDetached;
            }
            catch (Exception)
            {
                return false;
            }
        }

        [HttpGet("processes")]
        public async Task<IEnumerable<IdNameModel>> GetAvailableProcesses()
        {
            var processes = await _workplaceService.GetAvailableProcesses();
            return processes.Select(p => p.ToIdNameModel()).ToList();
        }

        [HttpGet("processes/{wpProcId:int}")]
        public async Task<WorkplaceProcessModel> GetWorplaceProcess(int wpProcId)
        {
            var process = await _workplaceService.GetWorkplaceProcess(wpProcId);
            return process.ToModel();
        }

        [HttpGet("processes/{wpProcId:int}/workbenches")]
        public async Task<IEnumerable<WorkbenchViewModel>> GetWorkbenches(int wpProcId)
        {
            var wbs = await _workplaceService.GetWorkbenches(wpProcId);
            return wbs.Select(w => w.ToViewModel()).ToList();
        }

        [HttpPost("processes/{wpProcId:int}/workbenches")]
        public async Task<WorkbenchViewModel> AddWorkbench(int wpProcId, WorkbenchViewModel model)
        {
            var wb = model.ToEntity();
            wb.Id = 0;
            wb.WorkplaceProcessId = wpProcId;
            wb = await _workplaceService.SaveWorkbench(wb);
            return wb.ToViewModel();
        }

        [HttpGet("processes/workbenches/{id:int}")]
        public async Task<WorkbenchViewModel> GetWorkbench(int id)
        {
            var result = await _workplaceService.GetWorkbench(id);
            return result.ToViewModel();
        }

        [HttpPut("processes/workbenches/{id:int}")]
        public async Task<WorkbenchViewModel> SaveWorkbench(int id, WorkbenchViewModel model)
        {
            var wb = model.ToEntity();
            var result = await _workplaceService.SaveWorkbench(wb);
            return result.ToViewModel();
        }

        [HttpDelete("processes/{procId:int}/workbenches/{id:int}")]
        public async Task<WorkbenchViewModel> DeleteWorkbench(int id)
        {
            var wb = await _workplaceService.DeleteWorkbench(id);
            return wb.ToViewModel();
        }

        [HttpGet("processes/workbenches/{id:int}/devices")]
        public async Task<IEnumerable<WorkbenchDeviceConfigViewModel>> GetWorkbenchDevices(int id)
        {
            var devices = await _workplaceService.GetWorkbenchDevices(id);
            var result = devices.Select(d => d.ToViewModel()).ToList();
            foreach (var dev in result)
            {
                var driver = _plugins.GetDriver(dev.DriverGuid);
                var profiler = _plugins.GetProfile(dev.ProfilerGuid);
                dev.DriverName = driver?.Name;
                dev.DriverHomepage = driver?.Homepage;
                dev.ProfilerName = profiler?.Name;
                dev.ProfilerHomepage = profiler?.Homepage;
            }

            return result;
        }

        [HttpGet("processes/workbenches/{id:int}/requireddevices")]
        public async Task<IEnumerable<WorkplaceHostDeviceModel>> GetWorkbenchRequiredDevices(int id)
        {
            var workbench = await _workplaceService.GetWorkbench(id);
            var profiles = (await _processService.GetProfiles(workbench.WorkplaceProcess.ProcessId))
                .Select(p => p.ProfilerGuid);
            var devices = (await _workplaceService.GetDevices(workbench.WorkplaceProcess.WorkplaceId))
                .Where(d =>
                {
                    var driver = _plugins.GetDriver(d.HostDevice.Device.DriverGuid);
                    if (driver == null)
                    {
                        return false;
                    }

                    return driver.ProfileGuid == Guid.Empty || profiles.Contains(driver.ProfileGuid);
                });
            var models = devices.Select(d => d.ToModel()).ToList();
            foreach (var dev in models)
            {
                var driver = _plugins.GetDriver(dev.DriverGuid);
                var profiler = _plugins.GetProfile(driver?.ProfileGuid ?? Guid.Empty);
                dev.DriverName = driver?.Name;
                dev.ProfilerGuid = driver?.ProfileGuid ?? Guid.Empty;
                dev.ProfilerName = profiler?.Name;
            }
            return models;
        }

        [HttpPost("processes/workbenches/{id:int}/devices")]
        public async Task<WorkbenchDeviceConfigViewModel> GetWorkbenchDevices(int id, WorkbenchDeviceConfigViewModel model)
        {
            var device = model.ToEntity();
            device.Id = 0;
            device.WorkbenchId = id;
            var result = await _workplaceService.SaveWorkbenchDevice(device);
            return result.ToViewModel();
        }

        [HttpDelete("processes/workbenches/{wbId:int}/devices/{id:int}")]
        public async Task<WorkbenchDeviceConfigViewModel> DeleteWorkbenchDevice(int id)
        {
            var device = await _workplaceService.DeleteWorkbenchDevice(id);
            return device.ToViewModel();
        }

        [HttpGet("processes/workbenches/devices/{id:int}")]
        public async Task<WorkbenchDeviceConfigViewModel> GetWorkbenchDevice(int id)
        {
            var device = await _workplaceService.GetWorkbenchDevice(id);
            var result = device.ToViewModel();
            var driver = _plugins.GetDriver(result.DriverGuid);
            var profiler = _plugins.GetProfile(driver?.ProfileGuid ?? Guid.Empty);
            result.ProfileOutput = device.Profile.Output;
            result.DriverName = driver?.Name;
            result.DriverHomepage = driver?.Homepage;
            result.ProfilerGuid = driver?.ProfileGuid ?? Guid.Empty;
            result.ProfilerName = profiler?.Name;
            result.ProfilerHomepage = profiler?.Homepage;

            return result;
        }

        [HttpPut("processes/workbenches/devices/{id:int}")]
        public async Task<bool> SaveWorkbenchDeviceOptions(int id, [FromBody] object options)
        {
            var str = JsonConvert.SerializeObject(options);
            var result = await _workplaceService.SaveWorkbenchDeviceOptions(id, str);
            return result != null;
        }

        #endregion
    }
}
