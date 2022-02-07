using Microprojects.Edm.Cache;
using Microprojects.Edm.Jobs;
using Microsoft.EntityFrameworkCore;
using Optosense.Edm.Core.Persistance;
using Optosense.Edm.Domain.Models;
using System;
using System.Threading.Tasks;

namespace Optosense.Edm.Jobs
{
    [Job(
        Name = "StartTestOperation",
        Lifetime = JobLifetime.LongRunning,
        Parameters = typeof(StartOperationJobParameters))]
    public class StartTestOperationJob : BaseJob
    {
        protected ICache Cache { get; init; }
        protected IEdmContextFactory ContextFactory { get; init; }
        protected StartOperationJobParameters Parameters => (StartOperationJobParameters)JobParameters;

        public StartTestOperationJob() { }
        public StartTestOperationJob(ICache cache, IEdmContextFactory contextFactory)
        {
            Cache = cache;
            ContextFactory = contextFactory;
        }

        public override bool Init()
        {
            return true;
        }

        public override async Task<object> ExecuteAsync()
        {
            var now = DateTime.Now;
            var waitBeforeStart = now > Parameters.StartAt ? TimeSpan.Zero : Parameters.StartAt - now;
            var cancelled = false;
            var opHostDeviceId = 0;
            using (var db = ContextFactory.Create())
            {
                var dev = await db.OperationHostDevices
                    .FirstOrDefaultAsync(o => o.OperationId == Parameters.Operation) ??
                    throw new Exception("Cannot find requested operation");
                opHostDeviceId = dev.Id;
            }

            try
            {
                await Task.Delay(waitBeforeStart, CancellationToken);
                for (int count = 1; count <= 60; count++)
                {
                    var record = new Record
                    {
                        IsValid = true,
                        Status = ExecutionStatus.Succeed,
                        ScheduledAt = DateTime.Now,
                        ExecutedAt = DateTime.Now,
                        Message = string.Empty,
                        OperationHostDeviceId = opHostDeviceId,
                        Parameters = "{}",
                        Request = $"instrunction #{count}",
                        Response = "Well done",
                        Info = $"Some info about operation #{count}"
                    };
                    Cache.Push(record);
                    await Task.Delay(1000, CancellationToken);
                }
            }
            catch (TaskCanceledException)
            {
                cancelled = true;
            }

            using (var db = ContextFactory.Create())
            {
                now = DateTime.Now;
                var operation = await db.Operations.FindAsync(Parameters.Operation);
                if (cancelled)
                {
                    operation.Cancelled = now;
                }

                operation.Completed = now;
                await db.SaveChangesAsync();
            }

            return "Ok";
        }
    }
}


