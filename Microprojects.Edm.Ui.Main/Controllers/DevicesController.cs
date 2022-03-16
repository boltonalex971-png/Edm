using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Optosense.Edm.Core.Contracts;
using Optosense.Edm.Domain.Models;
using Optosense.Edm.Plugins;
using Microprojects.Edm.Ui.Main.Models;
using Microprojects.Edm.Ui.Main.Utils;

namespace Microprojects.Edm.Ui.Main.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DevicesController : AuthControllerBase
    {
        private readonly ILogger<DevicesController> _logger;
        private readonly IDeviceService _deviceService;
        private readonly IHierarchyService _hierarchyService;
        private readonly IPluginContainer _plugins;
        private readonly IMapper _mapper;

        public DevicesController(ILogger<DevicesController> logger, IMapper mapper, IDeviceService deviceService, IHierarchyService hierarchyService, IPluginContainer pluginContainer)
        {
            _logger = logger;
            _mapper = mapper;
            _deviceService = deviceService;
            _hierarchyService = hierarchyService;
            _plugins = pluginContainer;
        }

        [HttpGet]
        public async Task<IEnumerable<Device>> Get()
        {
            return await _deviceService.GetAll();
        }

        [HttpGet("{id:int}")]
        public async Task<Device> GetById(int id)
        {
            if (id > 0)
            {
                return await _deviceService.Get(id);
            }
            else
            {
                return new Device { 
                    Name = string.Empty,
                    Description = string.Empty,
                    IsActive = true
                };
            }
        }

        [HttpPut("{id:int}")]
        public async Task<Device> Save(int id, [FromBody] Device device)
        {
            if (id != device.Id)
            {
                throw new Exception("Process id is ambiguous");
            }
            var result = await _deviceService.Save(device);
            return result;
        }

        [HttpDelete("{id:int}")]
        public async Task<Device> Delete(int id)
        {
            var process = await _deviceService.Delete(id);
            return process;
        }

        [HttpPost]
        public async Task<Device> Create([FromBody] Device device)
        {
            device.Id = 0;
            // If hierarchy is not defined select default root
            device.HierarchyId = device.HierarchyId == 0 ? (await _hierarchyService.GetRoot(HierarchyType.Device)).Id : device.HierarchyId;
            var result = await _deviceService.Save(device);
            return result;
        }

        [HttpPut("{id:int}/parent")]
        public async Task<Device> ChangeParent(int id, [FromBody] HierarchyItemViewModel parent)
        {
            var result = await _deviceService.ChangeParent(id, parent.Id);
            return result;
        }

        [HttpGet("hierarchy")]
        public async Task<IEnumerable<HierarchyItemViewModel>> GetHierarchy()
        {
            var devices = _mapper.Map<IEnumerable<HierarchyItemViewModel>>(
                await _deviceService.GetAll());
            var folders = _mapper.Map<IEnumerable<HierarchyItemViewModel>>(
                await _hierarchyService.GetTree(HierarchyType.Device, UserInfo));
            //var expanded = _cache.RestoreMany<TreeExpanedState>(UiCacheHelper.OwnerKey(this), () => HierarchyType.Host);
            //foreach (var folder in folders)
            //{
            //    folder.expanded = expanded?.Any(e => e.Id == folder.Id) ?? false;
            //}

            var tree = folders.Concat(devices).ToTree().ToList();
            // always expand root if just one
            if (tree.Count == 1)
            {
                tree.First().expanded = true;
            }

            return tree;
        }

        [HttpGet("drivers")]
        public IEnumerable<IDriverPlugin> GetDrivers()
        {
            var drivers = _plugins.GetDrivers();
            return drivers;
        }

        [HttpGet("profilers")]
        public IEnumerable<IProfilePlugin> GetProfilers()
        {
            var profilers = _plugins.GetProfiles();
            return profilers;
        }

        [HttpGet("driver/{driverGuid}")]
        public async Task<IEnumerable<Device>> GetByDriver(string driverGuid)
        {
            var devices = await _deviceService.Get(d => d.DriverGuid == new Guid(driverGuid) && d.IsActive);
            return devices;
        }

        #region devices

        [HttpGet("{id:int}/hosts")]
        public async Task<IEnumerable<HostDeviceModel>> GetDevices(int id)
        {
            var hosts = await _deviceService.GetHosts(id);
            return _mapper.Map<IEnumerable<HostDeviceModel>>(hosts);
        }

        [HttpPost("{id:int}/hosts")]
        public async Task<HostDeviceModel> AttachHostDevice(int id, HostDeviceModel model)
        {
            var hostDevice = _mapper.Map<HostDevice>(model);
            hostDevice.DeviceId = id;
            var host = await _deviceService.AttachHost(hostDevice);
            return _mapper.Map<HostDeviceModel>(host);
        }

        [HttpDelete("{id:int}/hosts/{hostId:int}")]
        public async Task<bool> DetachDevice(int id, int hostId)
        {
            var wasDetached = await _deviceService.DetachHost(id, hostId);
            return wasDetached;
        }

        [HttpGet("hosts")]
        public async Task<IEnumerable<IdNameModel>> GetAvailableDevices()
        {
            var hosts = await _deviceService.GetAvailableHosts();
            return _mapper.Map<IEnumerable<IdNameModel>>(hosts);
        }

        [HttpGet("hosts/{id:int}")]
        public async Task<HostDeviceModel> GetHostDevice(int id)
        {
            var host = await _deviceService.GetHostDevice(id);
            return _mapper.Map<HostDeviceModel>(host);
        }

        #endregion
    }
}
