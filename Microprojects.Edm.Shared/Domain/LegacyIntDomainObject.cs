using System;
using System.Collections.Generic;

namespace Microprojects.Edm.Domain
{
    // Int-Id base used by pre-Meta entities (Profile, Record, Audit, Setting, link tables, etc.).
    // New entities should derive from the Guid-Id DomainObject in this namespace instead.
    public abstract class LegacyIntDomainObject : IEquatable<LegacyIntDomainObject>
    {
        public virtual int Id { get; set; }

        public override string ToString()
        {
            return Id.ToString();
        }

        public bool Equals(LegacyIntDomainObject other)
        {
            return GetType() == other?.GetType() && Id == other.Id;
        }

        public LegacyIntDomainObject Copy()
        {
            return (LegacyIntDomainObject)MemberwiseClone();
        }
    }

    public class LegacyIntDomainObjectComparer<T> : IEqualityComparer<T> where T : LegacyIntDomainObject
    {
        public bool Equals(T x, T y)
        {
            return x.GetType() == y.GetType() && x.Id == y.Id;
        }

        public int GetHashCode(T obj)
        {
            return obj.GetType().GetHashCode() ^ obj.Id.GetHashCode();
        }
    }
}
