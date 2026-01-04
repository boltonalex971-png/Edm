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
using AutoMapper;
using Optosense.Edm.Infrastructure.Edm.Intercom;
using Optosense.Edm.Infrastructure.Models;

namespace Optosense.Edm.Jobs
{
    [Job(Name = "StoreOperationRecords", Lifetime = JobLifetime.LongRunning,
        Parameters = typeof(StoreOperationRecordsJobParameters))]
    public class StoreOperationRecordsJob : BaseJob
    {
        protected IIntercom Intercom { get; init; }
        protected IDbContextFactory<EdmContext> ContextFactory { get; init; }
        protected StoreOperationRecordsJobParameters Parameters => (StoreOperationRecordsJobParameters)JobParameters;
        private readonly ILogger<StoreOperationRecordsJob> _logger;
        private readonly IMapper _mapper;

        public StoreOperationRecordsJob()
        {
        }

        public StoreOperationRecordsJob(ILogger<StoreOperationRecordsJob> logger, IIntercom intercom,
            IDbContextFactory<EdmContext> factory, IMapper mapper)
        {
            Intercom = intercom;
            ContextFactory = factory;
            _logger = logger;
            _mapper = mapper;
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
                            Data = _mapper.Map<OperationDeviceData>(rec)
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