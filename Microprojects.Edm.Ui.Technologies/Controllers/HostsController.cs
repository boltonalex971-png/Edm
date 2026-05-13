using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microprojects.Edm.Controllers;
using Microprojects.Edm.Jobs;
using Microprojects.Edm.Plugins;
using Microprojects.Edm.Ui.Technologies.Contracts;
using Microprojects.Edm.Ui.Technologies.Models;
using Microprojects.Edm.Ui.Technologies.Utils;

namespace Microprojects.Edm.Ui.Technologies.Controllers
{
    [ApiController]
    [Route("api/technologies/[controller]")]
    public class HostsController : AuthControllerBase
    {
        private readonly ILogger<HostsController> _logger;
        private readonly IHostService _hostService;
        private readonly IHierarchyService _hierarchyService;
        private readonly IPluginContainer _plugins;
        private readonly IJobContainer _jobContainer;

        public HostsController(
            ILogger<HostsController> logger,
            IHostService hostService,
            IHierarchyService hierarchyService,
            IPluginContainer plugins,
            IJobContainer jobContainer,
            IConfiguration configuration) :
            base(configuration)
        {
            _logger = logger;
            _hostService = hostService;
            _hierarchyService = hierarchyService;
            _plugins = plugins;
            _jobContainer = jobContainer;
        }

        [HttpGet]
        public async Task<IEnumerable<Host>> Get()
        {
            return await _hostService.GetAll();
        }

        [HttpGet("{id:int}")]
        public async Task<HostModel> GetById(int id)
        {
            Host host;
            if (id > 0)
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
                    Url = string.Empty
                };
            }

            var peer = _jobContainer.Hive.GetActivePeers().FirstOrDefault(h => h.Host == host.Url) ?? new Peer();
            return host.ToModel(peer);
        }

        [HttpPut("{id:int}")]
        public async Task<Host> Save(int id, [FromBody] Host host)
        {
            if (id != host.Id)
            {
                throw new Exception("Host id is ambiguous");
            }

            var result = await _hostService.Save(host);
            return result;
        }

        [HttpDelete("{id:int}")]
        public async Task<Host> Delete(int id)
        {
            var host = await _hostService.Delete(id);
            return host;
        }

        [HttpPost]
        public async Task<Host> Create([FromBody] Host host)
        {
            host.Id = 0;
            // If hierarchy is not defined select default root
            host.HierarchyId = host.HierarchyId == 0 ? (await _hierarchyService.GetRoot(HierarchyType.Host)).Id : host.HierarchyId;
            var result = await _hostService.Save(host);
            return result;
        }

        [HttpPut("{id:int}/parent")]
        public async Task<Host> ChangeParent(int id, [FromBody] DomainObjectViewModel parent)
        {
            var result = await _hostService.ChangeParent(id, parent.Id);
            return result;
        }

        [HttpGet("hierarchy")]
        public async Task<IEnumerable<HierarchyItemViewModel>> GetHostHierarchy()
        {
            var hosts = (await _hostService.GetAll())
                .Select(h => h.ToHierarchyItem()).ToList();
            var folders = (await _hierarchyService.GetTree(HierarchyType.Host, UserInfo.Groups))
                .Select(h => h.ToHierarchyItem()).ToList();

            var tree = folders.Concat(hosts).ToTree().ToList();
            // always expand root if just one
            if (tree.Count() == 1)
            {
                tree.First().expanded = true;
            }

            return tree;
        }


        #region devices
        [HttpGet("{id:int}/devices")]
        public async Task<IEnumerable<HostDeviceModel>> GetDevices(int id)
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

        [HttpPost("{id:int}/devices")]
        public async Task<HostDeviceModel> AttachHostDevice(int id, HostDeviceModel model)
        {
            var hostDevice = model.ToEntity();
            hostDevice.HostId = id;
            var device = await _hostService.AttachDevice(hostDevice);
            return device.ToModel();
        }

        [HttpDelete("{id:int}/devices/{devId:int}")]
        public async Task<bool> DetachDevice(int id, int devId)
        {
            var wasDetached = await _hostService.DetachDevice(id, devId);
            return wasDetached;
        }

        [HttpGet("devices")]
        public async Task<IEnumerable<IdNameModel>> GetAvailableDevices()
        {
            var devices = await _hostService.GetAvailableDevices();
            return devices.Select(d => d.ToIdNameModel()).ToList();
        }

        [HttpGet("devices/{id:int}")]
        public async Task<HostDeviceModel> GetHostDevice(int id)
        {
            var device = await _hostService.GetHostDevice(id);
            return device.ToModel(_plugins);
        }
        #endregion
    }
}
