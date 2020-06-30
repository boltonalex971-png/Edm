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
    public class HostsController : ControllerBase
    {
        private readonly ILogger<HostsController> _logger;
        private readonly IMapper _mapper;
        private readonly IHostService _hostService;

        public HostsController(ILogger<HostsController> logger, IMapper mapper, IHostService hostService)
        {
            _logger = logger;
            _mapper = mapper;
            _hostService = hostService;
        }

        [HttpGet]
        public async Task<IEnumerable<Host>> Get()
        {
            return await _hostService.GetAll();
        }

        [HttpGet("{id:int}")]
        public async Task<Host> GetById(int id)
        {
            if (id > 0)
            {
                return await _hostService.Get(id);
            }
            else
            {
                return new Host
                {
                    Name = string.Empty,
                    Description = string.Empty,
                    Port = 4333,
                    Url = string.Empty
                };
            }
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
            var result = await _hostService.Save(host);
            return result;
        }

        #region devices
        [HttpGet("{id:int}/devices")]
        public async Task<IEnumerable<HostDeviceModel>> GetDevices(int id)
        {
            var devices = await _hostService.GetDevices(id);
            return _mapper.Map<IEnumerable<HostDeviceModel>>(devices);
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
