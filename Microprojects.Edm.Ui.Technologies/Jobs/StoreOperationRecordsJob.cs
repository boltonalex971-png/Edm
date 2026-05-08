using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microprojects.Edm.Drivers;
using Microprojects.Edm.Intercom;
using Microprojects.Edm.Jobs;
using Microprojects.Edm.Ui.Technologies.Intercom;
using Microprojects.Edm.Ui.Technologies.Models;
using Microprojects.Edm.Ui.Technologies.Persistence;
using Newtonsoft.Json;

namespace Microprojects.Edm.Ui.Technologies.Jobs
{
    [Job(Name = "StoreOperationRecords", Lifetime = JobLifetime.LongRunning,
        Parameters = typeof(StoreOperationRecordsJobParameters))]
    public class StoreOperationRecordsJob : BaseJob
    {
        protected IIntercom Intercom { get; init; }
        protected IDbContextFactory<TechnologiesContext> ContextFactory { get; init; }
        protected StoreOperationRecordsJobParameters Parameters => (StoreOperationRecordsJobParameters)JobParameters;
        private readonly ILogger<StoreOperationRecordsJob> _logger;

        public StoreOperationRecordsJob()
        {
        }

        public StoreOperationRecordsJob(ILogger<StoreOperationRecordsJob> logger, IIntercom intercom,
            IDbContextFactory<TechnologiesContext> factory)
        {
            Intercom = intercom;
            ContextFactory = factory;
            _logger = logger;
        }

        public override async Task<object> ExecuteAsync()
        {
            using var paramsSubscriber = Intercom.UseId(Parameters.Operation).HandleParameter(
                param =>
                {
                    if (param.Key == "Stop" && (bool)param.Value)
                    {
                        CancellationTokenSource.Cancel();
                    }
                    
                    return Task.CompletedTask;
                });
            using var subscription = Intercom.UseId(Parameters.Operation).HandleDeviceResponse(
                async r =>
                {
                    // TODO Cache coming record to avoid loosing it and handle them later
                    var rec = new RecordEvent
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
                    await using var context = await ContextFactory.CreateDbContextAsync();
                    try
                    {
                        context.Records.Add(rec);
                        await context.SaveChangesAsync();
                        await Intercom.PublishRecordAsync(Parameters.Operation, rec);
                        var data = new RecordDataEvent {
                            Data = rec.ToDeviceData()
                        };
                        await Intercom.PublishOperationDataAsync(Parameters.Operation, data);
                        if (r.Request == "Stop")
                        {
                            await CancellationTokenSource.CancelAsync();
                        }
                    }
                    catch (Exception e)
                    {
                        //TODO Check what was saved in the context (and publish it)
                        //     and store the records that weren't
                        // Swallow the exception not to breaking up storing process
                        _logger.LogWarning(Parameters.Operation, e, "Some Records are lost");
                    }
                });

            await Task.Delay(-1, CancellationToken).ContinueWith(t => { });

            _logger.LogDebug(Parameters.Operation, "{Command} {Action}", 
                Name, CancellationToken.IsCancellationRequested ? "cancelled" : "completed");
            return "Ok";
        }
    }

    public class StoreOperationRecordsJobParameters : IJobParameters
    {
        public int Operation { get; set; }
    }
}