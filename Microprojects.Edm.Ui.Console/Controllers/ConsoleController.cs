using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.EventLog;
using Microsoft.Extensions.Options;
using Microprojects.Edm.Jobs;
using Microprojects.Edm.Plugins;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Runtime.Versioning;

namespace Microprojects.Edm.Ui.Console.Controllers
{
    [ApiController]
    [Route("api")]
    public class ConsoleController : ControllerBase
    {
        private readonly IJobContainer _jobs;
        private readonly IPluginContainer _plugins;
        private readonly IOptions<EventLogSettings> _logSettings;

        public ConsoleController(IJobContainer jobs, IPluginContainer plugins, IOptions<EventLogSettings> logSettings)
        {
            _jobs = jobs;
            _plugins = plugins;
            _logSettings = logSettings;
        }

        [HttpGet("tasks/available")]
        public IEnumerable<AvailableTask> GetAvailableTasks()
        {
            return _jobs.GetAvailableTasks();
        }

        [HttpGet("tasks/running")]
        public IEnumerable<AvailableTask> GetRunningTasks()
        {
            return _jobs.GetRunningTasks();
        }

        [HttpGet("log")]
        [SupportedOSPlatform("windows")]
        public IEnumerable<object> GetLogMessages(int startFrom = 0, int amount = 50, string level = "")
        {
            var take = amount > 0 ? amount : 50;
            var log = EventLog.GetEventLogs().FirstOrDefault(l => l.Log == _logSettings.Value.LogName);
            if (log == null)
            {
                return Enumerable.Empty<object>();
            }
            var query = log.Entries.Cast<EventLogEntry>()
                .OrderByDescending(e => e.TimeGenerated);
            IEnumerable<EventLogEntry> filtered = query;
            if (!string.IsNullOrEmpty(level))
            {
                filtered = query.Where(e => string.Equals(e.EntryType.ToString(), level, System.StringComparison.OrdinalIgnoreCase));
            }
            return filtered
                .Skip(startFrom)
                .Take(take)
                .Select(l => new
                {
                    l.Message,
                    l.Source,
                    l.TimeGenerated,
                    EntryType = l.EntryType.ToString(),
                })
                .ToList();
        }

        [HttpGet("log/levels")]
        [SupportedOSPlatform("windows")]
        public IEnumerable<string> GetLogLevels()
        {
            var log = EventLog.GetEventLogs().FirstOrDefault(l => l.Log == _logSettings.Value.LogName);
            if (log == null)
            {
                return Enumerable.Empty<string>();
            }
            return log.Entries.Cast<EventLogEntry>()
                .Select(e => e.EntryType.ToString())
                .Distinct()
                .OrderBy(s => s)
                .ToList();
        }

        [HttpGet("drivers")]
        public IEnumerable<IDriverPlugin> GetDrivers()
        {
            return _plugins.GetDrivers();
        }

        [HttpGet("plugins")]
        public IEnumerable<object> GetPlugins()
        {
            return _plugins.GetAllPlugins().Select(p => new
            {
                guid = p.Guid,
                name = p.Name,
                description = p.Description,
                kind = p.GetType().Name,
                homepage = p.Homepage,
            });
        }
    }
}
