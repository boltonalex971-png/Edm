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

    // Replace SQL Server's default SqlServerSequentialGuidValueGenerator (UUIDv4)
    // with UuidV8ValueGenerator (DomainObject.NewGuid()) on every IDomainObject.Id.
    // EF invokes the generator only when the property is at its CLR default on Add,
    // so callers that set Id explicitly are still respected, and forgetting to set
    // it no longer silently inserts Guid.Empty -> PK violation on the second row.
    public static void ConfigureGuidIdsUseUuidV8(this ModelBuilder builder)
    {
        var entityTypes = builder.Model.GetEntityTypes()
            .Where(t => typeof(IDomainObject).IsAssignableFrom(t.ClrType));

        foreach (var entityType in entityTypes)
        {
            builder.Entity(entityType.ClrType)
                .Property(nameof(IDomainObject.Id))
                .HasValueGenerator<UuidV8ValueGenerator>()
                .ValueGeneratedOnAdd();
        }
    }
}
