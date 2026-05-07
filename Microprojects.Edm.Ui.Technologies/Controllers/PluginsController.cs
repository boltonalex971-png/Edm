using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Microprojects.Edm.Ui.Technologies.Contracts;
using Microprojects.Edm.Ui.Technologies.Models;
using Microprojects.Edm.Ui.Technologies.Models;
using Optosense.Edm.Plugins;
using Microprojects.Edm.Ui.Technologies.Models;

namespace Microprojects.Edm.Ui.Technologies.Controllers
{
    [ApiController]
    [Route("api/technologies/[controller]")]
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

        [HttpGet("{guid:guid}")]
        public IPlugin GetPlugin(Guid guid) => _plugins.GetPlugin(guid);

        [HttpGet("{guid:guid}/{setting}")]
        public async Task<string> GetByGuid(Guid  guid, string setting)
        {
            var result = await _settingService.Get(guid, setting);
            return result ?? string.Empty;
        }

        [HttpPut("{guid:guid}/{setting}")]
        public async Task<string> Save(Guid guid, string setting, [FromBody] object value)
        {
            var result = await _settingService.Set(guid, setting, JsonConvert.SerializeObject(value));
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
