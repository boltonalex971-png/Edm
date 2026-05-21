using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microprojects.Edm.Controllers;
using Microprojects.Edm.Plugins;
using Microprojects.Edm.Shared.Contracts;
using Microprojects.Edm.Shared.Utils;
using Microprojects.Edm.Shared.ViewModels;
using Microprojects.Edm.Ui.Technologies.Contracts;
using Microprojects.Edm.Ui.Technologies.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Microprojects.Edm.Ui.Technologies.Controllers
{
    [ApiController]
    [Route("api/technologies/[controller]")]
    public class DevicesController : AuthControllerBase
    {
        private readonly ILogger<DevicesController> _logger;
        private readonly IDeviceService _deviceService;
        private readonly IDirectoryService _directoryService;
        private readonly IPluginContainer _plugins;

        public DevicesController(ILogger<DevicesController> logger, IDeviceService deviceService,
            IDirectoryService directoryService, IPluginContainer pluginContainer,
            IConfiguration configuration) : base(configuration)
        {
            _logger = logger;
            _deviceService = deviceService;
            _directoryService = directoryService;
            _plugins = pluginContainer;
        }

        [HttpGet]
        public async Task<IEnumerable<Device>> Get()
        {
            return await _deviceService.GetAll();
        }

        [HttpGet("{id:guid}")]
        public async Task<Device> GetById(Guid id)
        {
            if (id != Guid.Empty)
            {
                return await _deviceService.Get(id);
            }
            return new Device
            {
                Name = string.Empty,
                Description = string.Empty,
                Meta = null!,
            };
        }

        [HttpPut("{id:guid}")]
        public async Task<Device> Save(Guid id, [FromBody] Device device)
        {
            if (id != device.Id)
            {
                throw new Exception("Device id is ambiguous");
            }
            return await _deviceService.Save(device);
        }

        [HttpDelete("{id:guid}")]
        public async Task<Device> Delete(Guid id)
        {
            return await _deviceService.Delete(id);
        }

        [HttpPost]
        public async Task<Device> Create([FromBody] Device device)
        {
            device.Id = Guid.Empty;
            device.DirectoryId ??= WellKnownDirectoryIds.Devices;
            device.Meta = null!;
            return await _deviceService.Save(device);
        }

        [HttpPut("{id:guid}/parent")]
        public async Task<Device> ChangeParent(Guid id, [FromBody] DomainObjectViewModel parent)
        {
            return await _deviceService.ChangeParent<Device>(id, parent.Id);
        }

        [HttpGet("hierarchy")]
        public async Task<IEnumerable<DirectoryEntryViewModel>> GetDeviceHierarchy()
        {
            var devices = await _deviceService.GetAll();
            return await DirectoryHelper.BuildEntryHierarchy(
                devices, WellKnownDirectoryIds.Devices, _directoryService, d => d.ToEntryViewModel());
        }

        [HttpGet("drivers")]
        public IEnumerable<IDriverPlugin> GetDrivers() => _plugins.GetDrivers();

        [HttpGet("profilers")]
        public IEnumerable<IProfilePlugin> GetProfilers() => _plugins.GetProfiles();

        [HttpGet("driver/{driverGuid}")]
        public async Task<IEnumerable<Device>> GetByDriver(string driverGuid)
        {
            return await _deviceService.Get(d => d.DriverGuid == new Guid(driverGuid));
        }

        #region hosts
        [HttpGet("{id:guid}/hosts")]
        public async Task<IEnumerable<HostDeviceModel>> GetDevices(Guid id)
        {
            var hosts = await _deviceService.GetHosts(id);
            return hosts.Select(h => h.ToModel()).ToList();
        }

        [HttpPost("{id:guid}/hosts")]
        public async Task<HostDeviceModel> AttachHostDevice(Guid id, HostDeviceModel model)
        {
            var hostDevice = model.ToEntity();
            hostDevice.DeviceId = id;
            var host = await _deviceService.AttachHost(hostDevice);
            return host.ToModel();
        }

        [HttpDelete("{id:guid}/hosts/{hostId:guid}")]
        public async Task<bool> DetachDevice(Guid id, Guid hostId)
        {
            return await _deviceService.DetachHost(id, hostId);
        }

        [HttpGet("hosts")]
        public async Task<IEnumerable<IdNameModel>> GetAvailableDevices()
        {
            var hosts = await _deviceService.GetAvailableHosts();
            return hosts.Select(h => h.ToIdNameModel()).ToList();
        }

        [HttpGet("hosts/{id:guid}")]
        public async Task<HostDeviceModel> GetHostDevice(Guid id)
        {
            var host = await _deviceService.GetHostDevice(id);
            return host.ToModel();
        }
        #endregion
    }
}
