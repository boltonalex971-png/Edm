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
using Optosense.Edm.Webui.Models;

namespace Optosense.Edm.WebUi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DevicesController : ControllerBase
    {
        private readonly ILogger<DevicesController> _logger;
        private readonly IDeviceService _deviceService;
        private readonly IPluginContainer _plugins;
        private readonly IMapper _mapper;

        public DevicesController(ILogger<DevicesController> logger, IMapper mapper, IDeviceService deviceService, IPluginContainer pluginContainer)
        {
            _logger = logger;
            _mapper = mapper;
            _deviceService = deviceService;
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
            var result = await _deviceService.Save(device);
            return result;
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

        [HttpGet("{driverGuid}")]
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

        //[HttpPost("{id:int}/devices")]
        //public async Task<HostDeviceModel> AttachHostDevice(int id, HostDeviceModel model)
        //{
        //    var hostDevice = _mapper.Map<HostDevice>(model);
        //    hostDevice.HostId = id;
        //    var device = await _hostService.AttachDevice(hostDevice);
        //    return _mapper.Map<HostDeviceModel>(device);
        //}

        //[HttpDelete("{id:int}/devices/{devId:int}")]
        //public async Task<bool> DetachDevice(int id, int devId)
        //{
        //    var wasDetached = await _hostService.DetachDevice(id, devId);
        //    return wasDetached;
        //}

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
