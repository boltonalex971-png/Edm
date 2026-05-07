using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Optosense.Edm.Core.Contracts;
using Optosense.Edm.Domain.Models;
using Optosense.Edm.Plugins;
using Optosense.Edm.Core.AspNet.Controllers;
using Microprojects.Edm.Ui.Main.Models;
using Microprojects.Edm.Ui.Main.Utils;
using Microsoft.Extensions.Configuration;

namespace Microprojects.Edm.Ui.Main.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WorkplacesController : AuthControllerBase
    {
        private readonly ILogger<WorkplacesController> _logger;
        private readonly IMapper _mapper;
        private readonly IWorkplaceService _workplaceService;
        private readonly IProcessService _processService;
        private readonly IHierarchyService _hierarchyService;
        private readonly IPluginContainer _plugins;

        public WorkplacesController(
            ILogger<WorkplacesController> logger,
            IMapper mapper,
            IWorkplaceService workplaceService,
            IProcessService processService,
            IHierarchyService hierarchyService,
            IPluginContainer plugins, IConfiguration configuration) :
            base(configuration)
        {
            _logger = logger;
            _mapper = mapper;
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
            var folders = _mapper.Map<IEnumerable<HierarchyItemViewModel>>(
                await _hierarchyService.GetTree(HierarchyType.Workplace, UserInfo.Groups));
            var workplaces = _mapper.Map<IEnumerable<HierarchyItemViewModel>>(
                await _workplaceService.Get(w => folders.Select(f => f.Id).Contains(w.HierarchyId) && w.IsActive));
            //o => o.Items["Type"] = HierarchyType.Workplace);
            //var expanded = _cache.RestoreMany<TreeExpanedState>(UiCacheHelper.OwnerKey(this), () => HierarchyType.Host);
            //foreach (var folder in folders)
            //{
            //    folder.expanded = expanded?.Any(e => e.Id == folder.Id) ?? false;
            //}

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
            var models = _mapper.Map<IEnumerable<WorkplaceHostDeviceModel>>(devices, o => o.State = _plugins);
            return models;
        }

        [HttpGet("devices/{workplaceDeviceId:int}")]
        public async Task<WorkplaceHostDeviceModel> GetDevice(int workplaceDeviceId)
        {
            var device = await _workplaceService.GetDevice(workplaceDeviceId);
            var model = _mapper.Map<WorkplaceHostDeviceModel>(device, o => o.State = _plugins);
            return model;
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

        [HttpGet("{id:int}/devices/{profilerGuid:guid}")]
        public async Task<IEnumerable<WorkplaceHostDeviceModel>> GetProfiledDevices(int id, Guid profilerGuid)
        {
            var hostDevices = (await _workplaceService.GetDevices(id))
                .Where(d => _plugins.GetDriver(d.HostDevice.Device.DriverGuid)?.ProfileGuid == profilerGuid)
                .AsEnumerable();
            return _mapper.Map<IEnumerable<WorkplaceHostDeviceModel>>(hostDevices);
        }

        #endregion

        #region processes

        [HttpGet("processes/allowed")]
        public async Task<IEnumerable<HierarchyItemViewModel>> GetProcessesHierarchy()
        {
            var folders = _mapper.Map<IEnumerable<HierarchyItemViewModel>>(
                await _hierarchyService.GetTree(HierarchyType.Workplace, UserInfo.Groups));
            var wpProc = await _workplaceService.GetAllowedProcesses(UserInfo.Groups);
            var workplaces = _mapper.Map<IEnumerable<HierarchyItemViewModel>>(
                wpProc.Select(wp => wp.Workplace).Distinct(new DomainObjectComparer<Workplace>()));
            var processes = _mapper.Map<IEnumerable<HierarchyItemViewModel>>(wpProc);
                //.Where(p => workplaces.Select(f => f.Id).Contains(p.ParentId));
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

            return _mapper.Map<IEnumerable<IdNameModel>>(hostDevices);
        }

        [HttpGet("{id:int}/processes")]
        public async Task<IEnumerable<WorkplaceProcessModel>> GetProcesses(int id)
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

        [HttpPut("{id:int}/processes")]
        public async Task<WorkplaceProcessModel> SaveWorkplaceProcess(int id, WorkplaceProcessModel model)
        {
            var wpProcess = _mapper.Map<WorkplaceProcess>(model);
            wpProcess.WorkplaceId = id;
            var result = await _workplaceService.SaveWorkplaceProcess(wpProcess);
            return _mapper.Map<WorkplaceProcessModel>(result);
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
            var models = _mapper.Map<IEnumerable<WorkplaceHostDeviceModel>>(devices);
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
