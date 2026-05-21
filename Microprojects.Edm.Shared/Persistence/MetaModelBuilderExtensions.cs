using System.Linq;
using Microprojects.Edm.Domain;
using Microsoft.EntityFrameworkCore;

namespace Microprojects.Edm.Shared.Persistence;

public static class MetaModelBuilderExtensions
{
    // For every IWithMeta entity, wire the shared-PK 1:1 FK to the Meta table.
    public static void ConfigureMetaEntities(this ModelBuilder builder)
    {
        var entityTypes = builder.Model.GetEntityTypes()
            .Where(t => typeof(IWithMeta).IsAssignableFrom(t.ClrType))
            .Select(t => t.ClrType);

        foreach (var entityType in entityTypes)
        {
            builder.Entity(entityType)
                .HasOne(nameof(IWithMeta.Meta))
                .WithOne()
                .HasForeignKey(entityType.Name, nameof(DomainObject.Id))
                .OnDelete(DeleteBehavior.NoAction);
        }
    }

    // Disable the SQL Server convention that would otherwise plug in
    // SqlServerSequentialGuidValueGenerator and produce non-time-sortable
    // UUIDv4 Ids whenever a code path forgets to call SetId() before
    // SaveChanges. All Guid Ids come from DomainObject.NewGuid().
    public static void ConfigureGuidIdsValueGeneratedNever(this ModelBuilder builder)
    {
        var entityTypes = builder.Model.GetEntityTypes()
            .Where(t => typeof(IDomainObject).IsAssignableFrom(t.ClrType));

        foreach (var entityType in entityTypes)
        {
            builder.Entity(entityType.ClrType)
                .Property(nameof(IDomainObject.Id))
                .ValueGeneratedNever();
        }
    }
}
