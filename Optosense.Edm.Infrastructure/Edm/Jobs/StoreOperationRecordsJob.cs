using Microprojects.Edm.Cache;
using Optosense.Edm.Domain.Models;
using Microprojects.Edm.Utils;
using System;
using System.Threading.Tasks;
using System.Threading;
using Microprojects.Edm.Jobs;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using Optosense.Edm.Persistence;

namespace Optosense.Edm.Jobs
{
    [Job(Name = "StoreOperationRecords", Lifetime = JobLifetime.LongRunning, Parameters = typeof(StoreOperationRecordsJobParameters))]
    public class StoreOperationRecordsJob : BaseJob
    {
        protected ICache Cache { get; init; }
        protected IDbContextFactory<EdmContext> ContextFactory { get; init; }
        protected StoreOperationRecordsJobParameters Parameters => (StoreOperationRecordsJobParameters) JobParameters;
        private readonly ILogger<StoreOperationRecordsJob> _logger;

        public StoreOperationRecordsJob() { }
        public StoreOperationRecordsJob(ILogger<StoreOperationRecordsJob> logger, ICache cache, IDbContextFactory<EdmContext> factory)
        {
            Cache = cache;
            ContextFactory = factory;
            _logger = logger;
        }

        public override async Task<object> ExecuteAsync()
        {
            bool completed = false;
            var subscription = Cache.Subscribe<Record>(Parameters.Channel,
                onNext: async r =>
                {
                    using var context = await ContextFactory.CreateDbContextAsync();
                    try
                    {
                        context.Records.Add(r);
                        await context.SaveChangesAsync();
                        await Cache.Publish(Parameters.AuditChannel, r);
                        completed = completed || r.Request.StartsWith("Stop");
                    }
                    catch (Exception e)
                    {
                        //TODO Check what was saved in the context (and publish it)
                        //     and store the records that weren't
                        // Swallow the exception not to breaking up storing process
                        _logger.LogWarning("Some InstructionExecutions lost: {Exception}", e.GetFullInfo());
                    }
                });
            while (!completed && !CancellationToken.IsCancellationRequested)
            {
                await Task.Delay(1000, CancellationToken)
                    .ContinueWith(t => { });
            }

            subscription.Dispose();
            _logger.LogDebug("{Command} {Action}", Name, completed ? "completed" : "cancelled");
            return "Ok";
        }
    }

    public class StoreOperationRecordsJobParameters : IJobParameters
    {
        public string Channel { get; set; }
        public string AuditChannel { get; set; }

    }
}


