using System;
using Microprojects.Edm.Domain;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.ValueGeneration;

namespace Microprojects.Edm.Shared.Persistence;

// EF Core value generator for DomainObject.Id. EF invokes Next() when the
// property is at its CLR default (Guid.Empty) on an Added entity, so explicit
// entity.Id = ... assignments are still honoured; everything else auto-mints
// UUIDv8 at SaveChanges. Replaces the host-wide SqlServerSequentialGuidValueGenerator
// (UUIDv4) that ConfigureGuidIdsUseUuidV8 disables.
public sealed class UuidV8ValueGenerator : ValueGenerator<Guid>
{
    public override Guid Next(EntityEntry entry) => DomainObject.NewGuid();

    public override bool GeneratesTemporaryValues => false;
}
