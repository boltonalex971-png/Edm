using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microprojects.Edm;
using Microprojects.Edm.Cache;
using Optosense.Edm.Domain.Models;
using Microprojects.Edm.Log;
using Microprojects.Edm.Utils;
using Newtonsoft.Json;
using Optosense.Edm.Utils;
using System.Diagnostics;
using Optosense.Edm.DataAccess;
using Microsoft.EntityFrameworkCore;
using Optosense.Edm.Infrastructure.Edm;
using System.Dynamic;
using Optosense.Edm.Core.Persistance;
using Optosense.Edm.Core.Contracts;
using Optosense.Edm.Core.Services;
using Optosense.Edm.Core.Auditing;
using Microprojects.Edm.Jobs;

namespace Optosense.Edm.Jobs
{
    [Job(Name = "StartAudit", Lifetime = JobLifetime.LongRunning, Parameters = typeof(StartAuditJobParameters))]
    public class StartAuditJob : BaseJob
    {
        protected StartAuditJobParameters Parameters => (StartAuditJobParameters) JobParameters;
        protected IJobContainer JobManager { get; init; }
        protected ICache Cache { get; init; }
        protected ILogger Logger { get; init; }
        protected IEdmContextFactory ContextFactory { get; init; }

        private Func<int, int, string, string> CacheKey = (opId, opCritId, addr) => 
            $"{nameof(Operation)}:{opId}:{nameof(OperationCriterion)}:{opCritId}:{addr}";

        public StartAuditJob() { }
        public StartAuditJob(IJobContainer container, ICache cache, IEdmContextFactory contextFactory)
        {
            JobManager = container;
            Cache = cache;
            ContextFactory = contextFactory;
        }

        public override bool Init()
        {
            return true;
        }

        public override async Task<object> ExecuteAsync()
        {
            IEnumerable<AuditZone> audit = default;
            using (var db = ContextFactory.Create()) 
            {
                var service = new AuditService(db);
                audit = await service.GetZones(Parameters.Audit);
            }

            var subscriber = Cache.Subscribe<Record>(Parameters.Channel,
                onNext: async rec =>
                {
                    // TODO move all db activity to corresponding core service
                    using IEdmContext db = ContextFactory.Create();
                    var currentOffset = (rec.ExecutedAt - Parameters.StartAt).TotalMinutes;
                    Console.WriteLine(rec.Parameters);
                    var effectiveZones = audit.Where(z => currentOffset >= z.Offset);
                    foreach (var zone in effectiveZones)
                    {
                        var recordParams = JsonConvert.DeserializeObject<dynamic>(rec.Parameters ?? "{}");
                        // Select criteria with existing parameter
                        foreach (var criterion in zone.Criteria.Where(c => recordParams[c.Param] != null ))
                        {
                            var auditFunc = AuditFunctions.Function(criterion.Function);
                            // take cached zone values list
                            var selector = (string)recordParams["ADDR"];
                            var key = CacheKey(Parameters.Operation, criterion.Id, selector);
                            var values = (await Cache.GetRangeAsync<string>(key,
                                    async () =>
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
                                            .Select(r => (string)JsonConvert.DeserializeObject<dynamic>(r)[criterion.Param]).ToList();
                                        return values;
                                    }, expireAt: TimeSpan.FromDays(10)))
                                    .ToList();
                            // Add new value to cache
                            var value = (string)JsonConvert.DeserializeObject<dynamic>(rec.Parameters)[criterion.Param];
                            values.Add(value);
                            Cache.Push(key, value);
                            // check
                            var auditResult = auditFunc(criterion, values);
                            // save result to db
                            var operationCriterion = (await db.OperationCriteria
                                .FirstOrDefaultAsync(oc => oc.OperationId == Parameters.Operation 
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
                        }
                    }
                });
            await Task.Delay(-1, CancellationToken);
            subscriber.Dispose();
            return "Ok";
        }
    }

    public class StartAuditJobParameters : IJobParameters
    {
        /// <summary>
        /// Running operation id
        /// </summary>
        [JobParameter(Required = true)]
        public int Operation { get; set; }

        /// <summary>
        /// Id of running profile to get associated audits
        /// </summary>
        [JobParameter(Required = true)]
        public int Audit { get; set; }
        public DateTime StartAt { get; set; } = DateTime.Now;
        public string Channel { get; set; }

    }

}


