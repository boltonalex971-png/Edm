using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Optosense.Edm.Core.Contracts;
using Optosense.Edm.Domain.Models;

namespace Optosense.Edm.WebUi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DevicesController : ControllerBase
    {
        private readonly ILogger<DevicesController> _logger;
        private readonly IDeviceService _deviceService;

        public DevicesController(ILogger<DevicesController> logger, IDeviceService deviceService)
        {
            _logger = logger;
            _deviceService = deviceService;
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
                    Model = DeviceModel.None,
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

        [HttpGet("models")]
        public IEnumerable<string> GetDeviceModels()
        {
            var models = ((DeviceModel[])Enum.GetValues(typeof(DeviceModel)))
                .Select(o => o.ToString());
            return models;
        }

    }
}
