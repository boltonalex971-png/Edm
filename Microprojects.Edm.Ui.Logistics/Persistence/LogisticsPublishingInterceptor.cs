using System.Threading;
using System.Threading.Tasks;
using Microprojects.Edm.Intercom;
using Microprojects.Edm.Ui.Logistics.Events;
using Microprojects.Edm.Ui.Logistics.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Logging;

namespace Microprojects.Edm.Ui.Logistics.Persistence;

// Captures the set of changed entities BEFORE SaveChanges (so EF-generated
// keys are stable for newly-created rows by the time we publish in
// SavedChangesAsync) and emits one LogisticsMessage per change to the
// "Logistics" SignalR channel.
//
// Failures during publish are swallowed so a hub outage never breaks
// SaveChanges — local invalidation (in-page pub/sub) keeps the originator
// consistent regardless.
public class LogisticsPublishingInterceptor : SaveChangesInterceptor
{
    private readonly IIntercom _intercom;
    private readonly IConnectionOrigin _origin;
    private readonly ILogger<LogisticsPublishingInterceptor> _logger;

    private readonly AsyncLocal<List<PendingChange>?> _pending = new();

    public LogisticsPublishingInterceptor(
        IIntercom intercom,
        IConnectionOrigin origin,
        ILogger<LogisticsPublishingInterceptor> logger)
    {
        _intercom = intercom;
        _origin = origin;
        _logger = logger;
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        var ctx = eventData.Context;
        if (ctx != null)
        {
            var list = new List<PendingChange>();
            foreach (var entry in ctx.ChangeTracker.Entries())
            {
                var op = entry.State switch
                {
                    EntityState.Added => LogisticsEntityOps.Created,
                    EntityState.Modified => LogisticsEntityOps.Updated,
                    EntityState.Deleted => LogisticsEntityOps.Deleted,
                    _ => null,
                };
                if (op == null) continue;

                var clrType = entry.Entity.GetType();
                var tags = EntityTypeTag.For(clrType);
                if (tags.Count == 0) continue;

                // Many-to-many: address each side by its own foreign key so
                // detail panels keyed by id refresh correctly. Falls through
                // to the generic IDomainObject path for the single-tag case.
                if (entry.Entity is NomenclatureTareType ntt)
                {
                    list.Add(new PendingChange(LogisticsEntityTypes.Nomenclature, ntt.NomenclatureId, op));
                    list.Add(new PendingChange(LogisticsEntityTypes.TareType, ntt.TareTypeId, op));
                    continue;
                }

                Guid? id = entry.Entity is IDomainObject dom ? dom.Id : null;
                foreach (var tag in tags)
                {
                    list.Add(new PendingChange(tag, id, op));
                }
            }
            _pending.Value = list;
        }

        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    public override async ValueTask<int> SavedChangesAsync(
        SaveChangesCompletedEventData eventData,
        int result,
        CancellationToken cancellationToken = default)
    {
        var changes = _pending.Value;
        _pending.Value = null;
        if (changes != null && changes.Count > 0)
        {
            var origin = _origin.ConnectionId;
            foreach (var c in changes)
            {
                try
                {
                    await _intercom.Publish(LogisticsMessage.Channel, new LogisticsMessage
                    {
                        Kind = LogisticsEventKinds.EntityChanged,
                        Type = c.Tag,
                        Id = c.Id,
                        Op = c.Op,
                        OriginConnectionId = origin,
                    });
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex,
                        "Failed to publish {Kind} for {Tag}/{Id}",
                        LogisticsEventKinds.EntityChanged, c.Tag, c.Id);
                }
            }
        }

        return await base.SavedChangesAsync(eventData, result, cancellationToken);
    }

    private sealed record PendingChange(string Tag, Guid? Id, string Op);
}
