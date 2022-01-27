using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.EventLog;
using Optosense.Edm.Plugins;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text;
using System.Collections;
using System.Threading.Tasks;
using Microsoft.Extensions.Options;
using Microprojects.Edm.Jobs;

namespace Microprojects.Edm.Ui.Console.Controllers
{
    [ApiController]
    [Route("api")]
    public class ConsoleController : ControllerBase
    {
        private IJobContainer _jobs;
        private IPluginContainer _plugins;
        private IOptions<EventLogSettings> _logSettings;

        public ConsoleController(IJobContainer jobs, IPluginContainer plugins, IOptions<EventLogSettings> logSettings)
        {
            _jobs = jobs;
            _plugins = plugins;
            _logSettings = logSettings;
        }

        [HttpGet("tasks/available")]
        public IEnumerable<AvailableTask> GetAvailableTasks()
        {
            var tasks = _jobs.GetAvailableTasks();
            return tasks;
        }

        [HttpGet("tasks/running")]
        public IEnumerable<AvailableTask> GetRunningTasks()
        {
            var tasks = _jobs.GetRunningTasks();
            return tasks;
        }

        [HttpGet("log")]
        public IEnumerable<object> GetLogMessages(int startFrom, int amount)
        {
            var log = EventLog.GetEventLogs().FirstOrDefault(l => l.Log == _logSettings.Value.LogName);
            var entries = log?.Entries.Cast<EventLogEntry>().OrderByDescending(e => e.TimeGenerated).Take(10).Select(l => new
            {
                l.Message,
                l.Source,
                l.TimeGenerated,
                EntryType = l.EntryType.ToString()
            }); ;
            return entries;
        }

        [HttpGet("drivers")]
        public IEnumerable<IDriverPlugin> GetDrivers()
        {
            return _plugins.GetDrivers();
        }
    }
}
