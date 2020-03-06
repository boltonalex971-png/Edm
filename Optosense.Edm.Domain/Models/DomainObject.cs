using System;
using System.Collections.Generic;

namespace Optosense.Edm.Domain.Models
{
    public abstract class DomainObject : IEquatable<DomainObject>
    {
        public virtual int Id { get; set; }

        //[Display(AutoGenerateField = false)]
        //[PropertyDependency("Id")]
        //public bool IsNew
        //{
        //    get { return Id <= 0; }
        //}

        #region Methods

        public override string ToString()
		{
			return Id.ToString();
		}

        public bool Equals(DomainObject other)
        {
            return GetType() == other.GetType() && Id == other.Id;
        }

        //public bool EquivalentTo(object another)
        //{
        //    var domainObject = another as DomainObject;

        //    if (domainObject == null)
        //    {
        //        return false;
        //    }

        //    return Id != 0 && domainObject.Id == Id;
        //}

        #endregion
    }

    public class DomainObjectComparer<T> : IEqualityComparer<T> where T : DomainObject
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
