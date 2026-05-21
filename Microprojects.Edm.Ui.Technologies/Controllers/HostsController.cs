using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microprojects.Edm.Controllers;
using Microprojects.Edm.Jobs;
using Microprojects.Edm.Plugins;
using Microprojects.Edm.Shared.Contracts;
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
    public class HostsController : AuthControllerBase
    {
        private readonly ILogger<HostsController> _logger;
        private readonly IHostService _hostService;
        private readonly IDirectoryService _directoryService;
        private readonly IPluginContainer _plugins;
        private readonly IJobContainer _jobContainer;

        public HostsController(
            ILogger<HostsController> logger,
            IHostService hostService,
            IDirectoryService directoryService,
            IPluginContainer plugins,
            IJobContainer jobContainer,
            IConfiguration configuration) : base(configuration)
        {
            _logger = logger;
            _hostService = hostService;
            _directoryService = directoryService;
            _plugins = plugins;
            _jobContainer = jobContainer;
        }

        [HttpGet]
        public async Task<IEnumerable<Host>> Get()
        {
            return await _hostService.GetAll();
        }

        [HttpGet("{id:guid}")]
        public async Task<HostModel> GetById(Guid id)
        {
            Host host;
            if (id != Guid.Empty)
            {
                host = await _hostService.Get(id);
            }
            else
            {
                host = new Host
                {
                    Name = string.Empty,
                    Description = string.Empty,
                    Port = 16333,
                    Url = string.Empty,
                    Meta = null!,
                };
            }

            var peer = _jobContainer.Hive.GetActivePeers().FirstOrDefault(h => h.Host == host.Url) ?? new Peer();
            return host.ToModel(peer);
        }

        [HttpPut("{id:guid}")]
        public async Task<Host> Save(Guid id, [FromBody] Host host)
        {
            if (id != host.Id)
            {
                throw new Exception("Host id is ambiguous");
            }

            return await _hostService.Save(host);
        }

        [HttpDelete("{id:guid}")]
        public async Task<Host> Delete(Guid id)
        {
            return await _hostService.Delete(id);
        }

        [HttpPost]
        public async Task<Host> Create([FromBody] Host host)
        {
            host.Id = Guid.Empty;
            host.DirectoryId ??= WellKnownDirectoryIds.Hosts;
            host.Meta = null!;
            return await _hostService.Save(host);
        }

        [HttpPut("{id:guid}/parent")]
        public async Task<Host> ChangeParent(Guid id, [FromBody] DomainObjectViewModel parent)
        {
            return await _hostService.ChangeParent<Host>(id, parent.Id);
        }

        #region devices
        [HttpGet("{id:guid}/devices")]
        public async Task<IEnumerable<HostDeviceModel>> GetDevices(Guid id)
        {
            var devices = await _hostService.GetDevices(id);
            var devModels = devices.Select(d => d.ToModel()).ToList();
            foreach (var dev in devModels)
            {
                var driver = _plugins.GetDriver(dev.DriverGuid);
                var profiler = _plugins.GetProfile(driver?.ProfileGuid ?? Guid.Empty);
                dev.DriverName = driver?.Name;
                dev.ProfilerGuid = driver?.ProfileGuid ?? Guid.Empty;
                dev.ProfilerName = profiler?.Name;
            }
            return devModels;
        }

        [HttpPost("{id:guid}/devices")]
        public async Task<HostDeviceModel> AttachHostDevice(Guid id, HostDeviceModel model)
        {
            var hostDevice = model.ToEntity();
            hostDevice.HostId = id;
            var device = await _hostService.AttachDevice(hostDevice);
            return device.ToModel();
        }

        [HttpDelete("{id:guid}/devices/{devId:guid}")]
        public async Task<bool> DetachDevice(Guid id, Guid devId)
        {
            return await _hostService.DetachDevice(id, devId);
        }

        [HttpGet("devices")]
        public async Task<IEnumerable<IdNameModel>> GetAvailableDevices()
        {
            var devices = await _hostService.GetAvailableDevices();
            return devices.Select(d => d.ToIdNameModel()).ToList();
        }

        [HttpGet("devices/{id:guid}")]
        public async Task<HostDeviceModel> GetHostDevice(Guid id)
        {
            var device = await _hostService.GetHostDevice(id);
            return device.ToModel(_plugins);
        }
        #endregion
    }
}
