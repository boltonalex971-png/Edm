using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Microprojects.Edm.Ui.Main.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Optosense.Edm.Core.Contracts;
using Optosense.Edm.Domain.Models;
using Optosense.Edm.Plugins;
using Optosense.Edm.WebUi.Models;
using Optosense.Edm.WebUi.Utils;

namespace Optosense.Edm.WebUi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HostsController : AuthControllerBase
    {
        private readonly ILogger<HostsController> _logger;
        private readonly IMapper _mapper;
        private readonly IHostService _hostService;
        private readonly IHierarchyService _hierarchyService;
        private readonly IPluginContainer _plugins;

        public HostsController(ILogger<HostsController> logger, IMapper mapper, IHostService hostService, IHierarchyService hierarchyService,IPluginContainer plugins)
        {
            _logger = logger;
            _mapper = mapper;
            _hostService = hostService;
            _hierarchyService = hierarchyService;
            _plugins = plugins;
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
                host = new HostModel
                {
                    Name = string.Empty,
                    Description = string.Empty,
                    Port = 16333,
                    Url = string.Empty
                };
            }

            return _mapper.Map<HostModel>(host);
        }

        [HttpPut("{id:int}")]
        public async Task<Host> Save(int id, [FromBody] Host host)
        {
            if (id != host.Id)
            {
                throw new Exception("Process id is ambiguous");
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
        public async Task<Host> ChangeParent(int id, [FromBody] HierarchyItemViewModel parent)
        {
                var result = await _hostService.ChangeParent(id, parent.Id);
                return result;
        }

        [HttpGet("hierarchy")]
        public async Task<IEnumerable<HierarchyItemViewModel>> GetHostHierarchy()
        {
            var hosts = _mapper.Map<IEnumerable<HierarchyItemViewModel>>(
                await _hostService.GetAll());
            var folders = _mapper.Map<IEnumerable<HierarchyItemViewModel>>(
                await _hierarchyService.GetTree(HierarchyType.Host, UserInfo));
            //var expanded = _cache.RestoreMany<TreeExpanedState>(UiCacheHelper.OwnerKey(this), () => HierarchyType.Host);
            //foreach (var folder in folders)
            //{
            //    folder.expanded = expanded?.Any(e => e.Id == folder.Id) ?? false;
            //}

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
            var devModels = _mapper.Map<IEnumerable<HostDeviceModel>>(devices);
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
            var hostDevice = _mapper.Map<HostDevice>(model);
            hostDevice.HostId = id;
            var device = await _hostService.AttachDevice(hostDevice);
            return _mapper.Map<HostDeviceModel>(device);
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
            return _mapper.Map<IEnumerable<IdNameModel>>(devices);
        }

        [HttpGet("devices/{id:int}")]
        public async Task<HostDeviceModel> GetHostDevice(int id)
        {
            var device = await _hostService.GetHostDevice(id);
            return _mapper.Map<HostDeviceModel>(device);
        }
        #endregion
    }
}
