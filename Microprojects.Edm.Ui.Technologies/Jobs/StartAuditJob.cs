using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using AdaptiveExpressions;
using Microprojects.Edm.Cache;
using Microprojects.Edm.Intercom;
using Microprojects.Edm.Jobs;
using Microprojects.Edm.Ui.Technologies.Auditing;
using Microprojects.Edm.Ui.Technologies.Intercom;
using Microprojects.Edm.Ui.Technologies.Models;
using Microprojects.Edm.Ui.Technologies.Persistence;
using Microprojects.Edm.Ui.Technologies.Services;
using Microprojects.Edm.Utils;
using Newtonsoft.Json;

namespace Microprojects.Edm.Ui.Technologies.Jobs
{
    [Job(Name = "StartAudit", Lifetime = JobLifetime.LongRunning, Parameters = typeof(StartAuditJobParameters))]
    public class StartAuditJob : BaseJob
    {
        protected StartAuditJobParameters Parameters => (StartAuditJobParameters) JobParameters;
        protected IJobContainer JobManager { get; init; }
        protected IIntercom Intercom { get; init; }
        protected ICache Cache { get; init; }
        protected ILogger<StartAuditJob> Logger { get; init; }
        protected IDbContextFactory<TechnologiesContext> ContextFactory { get; init; }

        private readonly string OffsetParamName = "Offset";
        private IDisposable _paramsSubscriber;
        private Dictionary<string, object> _inputParams = new();
        private Func<Guid, Guid, string, string> CacheKey = (opId, critId, addr) =>
            $"{nameof(Operation)}:{opId}:{nameof(OperationCriterion)}:{critId}:{addr}";


        public StartAuditJob() { }
        public StartAuditJob(IJobContainer container, ICache cache, IIntercom intercom, ILogger<StartAuditJob> logger,
            IDbContextFactory<TechnologiesContext> contextFactory)
        {
            JobManager = container;
            Intercom = intercom;
            Cache = cache;
            Logger = logger;
            ContextFactory = contextFactory;
        }

        public override Task<bool> InitAsync()
        {
            // Parameter subscriber must be initialized before executing to avoid loosing incoming parameters
            _paramsSubscriber = Intercom.UseId(Parameters.Operation).HandleParameter(
                param =>
                {
                    if (param.Key == "Stop" && (bool)param.Value)
                    {
                        CancellationTokenSource.Cancel();
                    }
                    else
                    {
                        PushInputParameter(KeyValuePair.Create(param.Key, param.Value));
                    }

                    return Task.CompletedTask;
                });
            return Task.FromResult(true);
        }

        public override async Task<object> ExecuteAsync()
        {
            IEnumerable<AuditZone> audit;
            await using (var db = await ContextFactory.CreateDbContextAsync()) 
            {
                // Audit zones are read for execution; pass null UserService
                // since there's no caller-scoped filtering at runtime.
                var service = new AuditService(db, userService: null);
                audit = await service.GetZones(Parameters.Audit);
            }

            using var subscriber = Intercom.UseId(Parameters.Operation).HandleRecord(
                async rec =>
                {
                    try
                    {
                        // TODO Cache coming record to avoid loosing it and handle them later
                        // TODO Use RX to filter records
                        if (rec == null || rec.OperationHostDeviceId != Parameters.Device)
                        {
                            return;
                        }

                        // TODO move all db activity to corresponding core service
                        await using TechnologiesContext db = await ContextFactory.CreateDbContextAsync();
                        var currentOffset = (rec.ExecutedAt - Parameters.StartAt).TotalMinutes;
                        var effectiveZones = audit.Where(z => IsActive(z, currentOffset));
                        foreach (var zone in effectiveZones)
                        {
                            var recordParams = rec.Parameters;
                            // Select criteria with existing parameter
                            foreach (var criterion in zone.Criteria.Where(c =>
                                         recordParams?.ContainsKey(c.Param) ?? false))
                            {
                                var auditFunc = AuditFunctions.Function(criterion.Function);
                                // take cached zone values list
                                var selector = recordParams.TryGetValue("ADDR", out var addr)
                                    ? addr.ToString()
                                    : string.Empty;
                                var key = CacheKey(Parameters.Operation, criterion.Id, selector);
                                var values = (await Cache.GetRangeAsync<object>(key, async () =>
                                    {
                                        var recs = await db.RecordOperationCriteria
                                            .Include(c => c.Record)
                                            .Include(c => c.OperationCriterion)
                                            .Where(c => c.OperationCriterion.OperationId == Parameters.Operation
                                                        && c.OperationCriterion.AuditCriterionId == criterion.Id
                                                        && c.OperationCriterion.Selector == selector)
                                            .Select(c => c.Record.Parameters)
                                            .ToListAsync();
                                        var values = recs
                                            .Select(r => r[criterion.Param])
                                            .ToList();
                                        return values;
                                    }, expireAt: TimeSpan.FromDays(10)))
                                    .ToList();
                                // Add new value to cache
                                var value = rec.Parameters[criterion.Param];
                                values.Add(value);
                                Cache.Push(key, value);

                                // Replace args with parameters if required
                                var crit = (AuditCriterion)criterion.Copy();
                                var param1 = Regex.Match(criterion.Arg1 ?? string.Empty, @"{(?<Name>\w*)}");
                                if (param1.Success &&
                                    _inputParams.TryGetValue(param1.Groups["Name"].Value, out var inputParam1))
                                {
                                    crit.Arg1 = inputParam1?.ToString();
                                }

                                var param2 = Regex.Match(criterion.Arg2 ?? string.Empty, @"{(?<Name>\w*)}");
                                if (param2.Success &&
                                    _inputParams.TryGetValue(param2.Groups["Name"].Value, out var inputParam2))
                                {
                                    crit.Arg2 = inputParam2?.ToString();
                                }

                                // check
                                var auditResult = auditFunc(crit, values);
                                // save result to db
                                var operationCriterion = (await db.OperationCriteria
                                                             .FirstOrDefaultAsync(oc =>
                                                                 oc.OperationId == Parameters.Operation
                                                                 && oc.AuditCriterionId == criterion.Id
                                                                 && oc.Selector == selector))
                                                         ?? db.OperationCriteria.Add(new OperationCriterion
                                                         {
                                                             AuditCriterionId = criterion.Id,
                                                             OperationId = Parameters.Operation,
                                                             Selector = selector
                                                         }).Entity;
                                operationCriterion.Result = auditResult.Result;
                                operationCriterion.Valid = auditResult.Valid;
                                operationCriterion.Message = auditResult.Message;
                                db.RecordOperationCriteria.Add(new RecordOperationCriterion
                                {
                                    RecordId = rec.Id,
                                    OperationCriterion = operationCriterion
                                });
                                await db.SaveChangesAsync();
                                operationCriterion.AuditCriterion = (AuditCriterion)criterion.Copy();
                                operationCriterion.AuditCriterion.Zone = null;
                                var data = new AuditDataEvent
                                {
                                    Data = operationCriterion.ToAuditData()
                                };
                                await Intercom.PublishOperationDataAsync(Parameters.Operation, data);
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        Logger.LogWarning(ex,
                            "{Command} failed processing incoming records for operation {Operation}, some data may be lost.\nRecords: {Records}\n{Exception}",
                            Name, Parameters.Operation, JsonConvert.SerializeObject(rec), ex.GetFullInfo());
                    }
                });

            await Task.Delay(-1, CancellationToken).ContinueWith(t => { });

            Logger.LogDebug("{Command} {Action} for operation {Operation}",
                Name, CancellationToken.IsCancellationRequested ? "cancelled" : "completed", Parameters.Operation);
            
            return JobStatus.SUCCESS;
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing) _paramsSubscriber.Dispose();  
        }

        private void PushInputParameter(KeyValuePair<string, object> param)
        {
            _inputParams[param.Key] = param.Value;
        }

        private bool IsActive(AuditZone zone, double currentOffset)
        {
            if (currentOffset < zone.Offset || currentOffset > zone.Offset + zone.Duration && zone.Offset + zone.Duration > 0)
            {
                return false;
            }

            var activeExpr = Expression.Parse(zone.ActiveWhen ?? bool.TrueString);
            var (confirmed, activeError) = activeExpr.TryEvaluate<bool>(_inputParams);
            if (activeError is not null)
            {
                Logger.LogError("Cannot evaluate audit zone {zoneNo} activation condition <{condition}> for operation {Operation}: {error}", zone.No, zone.ActiveWhen, Parameters.Operation, activeError);
            }
            
            return confirmed;
        }
    }

    public class StartAuditJobParameters : IJobParameters
    {
        /// <summary>
        /// Running operation id
        /// </summary>
        [JobParameter(Required = true)]
        public Guid Operation { get; set; }

        /// <summary>
        /// Id of running profile to get associated audits
        /// </summary>
        [JobParameter(Required = true)]
        public Guid Audit { get; set; }
        /// <summary>
        /// Id of <code>Microprojects.Edm.Ui.Technologies.Models.OperationHostDevice</code> which Audit belongs to.
        /// </summary>
        public Guid Device { get; set; }
        public DateTime StartAt { get; set; } = DateTime.UtcNow;
    }

}


