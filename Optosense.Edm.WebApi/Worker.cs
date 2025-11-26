using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Optosense.Edm.WebApi
{
    public class Worker : BackgroundService
    {
        private readonly ILogger<Worker> _logger;

        public Worker(ILogger<Worker> logger)
        {
            _logger = logger;
        }

        public override Task StartAsync(CancellationToken cancellationToken)
        {
            AppDomain.CurrentDomain.UnhandledException += (sender, args) =>
            {
                _logger.LogError((Exception)args.ExceptionObject, "Unhandled exception");
            };
            _logger.LogInformation("Service starting...");
            var startTask = base.StartAsync(cancellationToken);
            return startTask.ContinueWith(
                (task) => _logger.LogInformation("Service started."), 
                TaskContinuationOptions.OnlyOnRanToCompletion);
        }

        public override Task StopAsync(CancellationToken cancellationToken)
        {
            return base.StopAsync(cancellationToken);
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            await Task.Delay(-1, stoppingToken);
        }
    }
}
