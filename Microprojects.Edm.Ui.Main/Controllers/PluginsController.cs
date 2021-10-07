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
using Microprojects.Edm.Ui.Main.Models;
using Microprojects.Edm.Ui.Main.Models;

namespace Microprojects.Edm.Ui.Main.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PluginsController : ControllerBase
    {
        private readonly ILogger<PluginsController> _logger;
        private readonly IMapper _mapper;
        private readonly ISettingService _settingService;
        private readonly IPluginContainer _plugins;

        public PluginsController(ILogger<PluginsController> logger, IMapper mapper, ISettingService settingService, IPluginContainer plugins)
        {
            _logger = logger;
            _mapper = mapper;
            _settingService = settingService;
            _plugins = plugins;
        }

        [HttpGet("{guid}")]
        public IPlugin GetPlugin(string guid) => _plugins.GetPlugin(Guid.Parse(guid));

        [HttpGet("{guid}/{setting}")]
        public async Task<string> GetByGuid(string guid, string setting)
        {
            var result = await _settingService.Get(Guid.Parse(guid), setting);
            return result ?? string.Empty;
        }

        [HttpPut("{guid}/{setting}")]
        public async Task<string> Save(string guid, string setting, [FromBody] object value)
        {
            var result = await _settingService.Set(Guid.Parse(guid), setting, JsonConvert.SerializeObject(value));
            return result;
        }

        [HttpGet("profiles")]
        public IEnumerable<IPlugin> GetProfilePlugins() => _plugins.GetProfiles();

        [HttpGet("drivers")]
        public IEnumerable<DriverPluginInfoViewModel> GetDriverPlugins()
        {
            var plugins = _plugins.GetDrivers()
                .Select(p => new DriverPluginInfoViewModel
                {
                    Name = p.Name,
                    Description = p.Description,
                    Guid = p.Guid.ToString(),
                    ProfileGuid = p.ProfileGuid.ToString(),
                    ProfileName = _plugins.GetProfile(p.ProfileGuid)?.Name ?? (p.ProfileGuid != default ? p.ProfileGuid.ToString() : null)
                }).ToList();
            return plugins;
        }

        [HttpGet("operations")]
        public IEnumerable<IOperationPlugin> GetOperationPlugins() => _plugins.GetOperations();
    }
}
