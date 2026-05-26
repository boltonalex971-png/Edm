using System;
using UUIDNext;

namespace Microprojects.Edm.Domain;

public class DomainObject : IDomainObject
{
    public static Guid NewGuid() => Uuid.NewDatabaseFriendly(Database.SqlServer);
    public virtual Guid Id { get; set; }

    // Shallow clone used by code paths that want to mutate a detached snapshot
    // without affecting the tracked entity (e.g. audit-time parameter
    // substitution before checking criteria).
    public DomainObject Copy() => (DomainObject)MemberwiseClone();
}
