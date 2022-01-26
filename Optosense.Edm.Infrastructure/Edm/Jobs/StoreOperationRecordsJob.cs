using Microprojects.Edm;
using Microprojects.Edm.Cache;
using Microprojects.Edm.Log;
using Optosense.Edm.DataAccess;
using Optosense.Edm.Domain.Models;
using Microprojects.Edm.Utils;
using System;
using System.Threading.Tasks;
using Optosense.Edm.Core.Persistance;
using System.Threading;
using Microprojects.Edm.Jobs;

namespace Optosense.Edm.Jobs
{
    [Job(Name = "StoreOperationRecords", Lifetime = JobLifetime.LongRunning, Parameters = typeof(StoreOperationRecordsJobParameters))]
    public class StoreOperationRecordsJob : BaseJob
    {
        protected ICache Cache { get; init; }
        protected IEdmContextFactory ContextFactory { get; init; }
        protected StoreOperationRecordsJobParameters Parameters => (StoreOperationRecordsJobParameters) JobParameters;

        public StoreOperationRecordsJob() { }
        public StoreOperationRecordsJob(ICache cache, IEdmContextFactory factory)
        {
            Cache = cache;
            ContextFactory = factory;
        }

        public override async Task<object> ExecuteAsync()
        {
            var subscript = Cache.Subscribe<Record>(Parameters.Channel,
                onNext: async r =>
                {
                    using var context = ContextFactory.Create();
                    try
                    {
                        context.Records.Add(r);
                        await context.SaveChangesAsync();
                        await Cache.Publish(Parameters.AuditChannel, r);
                    }
                    catch (Exception e)
                    {
                        //TODO Check what was saved in the context (and publish it)
                        //     and store the records that weren't
                        // Swallow the exception not to breaking up storing process
                        Logger.Log($"Some InstructionExecutions lost: {e.GetFullInfo()}");
                    }
                });
            await Task.Delay(-1, CancellationToken);
            return "Ok";
        }
    }

    public class StoreOperationRecordsJobParameters : IJobParameters
    {
        public string Channel { get; set; }
        public string AuditChannel { get; set; }

    }
}


