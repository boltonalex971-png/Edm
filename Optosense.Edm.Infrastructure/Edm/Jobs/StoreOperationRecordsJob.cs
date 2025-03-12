using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Threading;
using Microprojects.Edm.Drivers;
using Microprojects.Edm.Jobs;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using Optosense.Edm.Persistence;
using Microprojects.Edm.Intercom;
using Newtonsoft.Json;
using Optosense.Edm.Domain.Models;

namespace Optosense.Edm.Jobs
{
    [Job(Name = "StoreOperationRecords", Lifetime = JobLifetime.LongRunning, Parameters = typeof(StoreOperationRecordsJobParameters))]
    public class StoreOperationRecordsJob : BaseJob
    {
        protected IIntercom Intercom { get; init; }
        protected IDbContextFactory<EdmContext> ContextFactory { get; init; }
        protected StoreOperationRecordsJobParameters Parameters => (StoreOperationRecordsJobParameters) JobParameters;
        private readonly ILogger<StoreOperationRecordsJob> _logger;

        public StoreOperationRecordsJob() { }
        public StoreOperationRecordsJob(ILogger<StoreOperationRecordsJob> logger, IIntercom intercom, IDbContextFactory<EdmContext> factory)
        {
            Intercom = intercom;
            ContextFactory = factory;
            _logger = logger;
        }

        public override async Task<object> ExecuteAsync()
        {
            bool completed = false;
            var subscription = Intercom.Subscribe<DeviceResponse>(Parameters.Channel,
                onNext: async r =>
                {
                    var rec = new Record
                    {
                        ScheduledAt = r.ScheduledAt,
                        ExecutedAt = r.ExecutedAt,
                        Request = r.Request,
                        Response = r.Response,
                        IsValid = r.Status == DriverResponseState.Ok,
                        Message = r.Message,
                        Parameters = JsonConvert.DeserializeObject<Dictionary<string, object>>(r.Parameters ?? "{}"), 
                        Status = (ExecutionStatus)r.Status,
                        OperationHostDeviceId = r.OperationHostDeviceId,
                    };
                    using var context = await ContextFactory.CreateDbContextAsync();
                    try
                    {
                        context.Records.Add(rec);
                        await context.SaveChangesAsync();
                        await Intercom.Publish(Parameters.AuditChannel, rec);
                        completed = completed || r.Request == "Stop";
                    }
                    catch (Exception e)
                    {
                        //TODO Check what was saved in the context (and publish it)
                        //     and store the records that weren't
                        // Swallow the exception not to breaking up storing process
                        _logger.LogWarning(Parameters.Operation, e, "Some Records are lost");
                    }
                });
            while (!completed && !CancellationToken.IsCancellationRequested)
            {
                await Task.Delay(1000, CancellationToken)
                    .ContinueWith(t => { });
            }

            subscription.Dispose();
            _logger.LogDebug(Parameters.Operation, "{Command} {Action}", Name, completed ? "completed" : "cancelled");
            return "Ok";
        }
    }

    public class StoreOperationRecordsJobParameters : IJobParameters
    {
        public int Operation {  get; set; }
        public string Channel { get; set; }
        public string AuditChannel { get; set; }

    }
}


