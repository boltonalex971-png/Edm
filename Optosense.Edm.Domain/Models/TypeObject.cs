using System;

namespace Optosense.Edm.Domain.Models
{
    public abstract class TypeObject : NamedObject, ILogicallyDeletableEntity
    {
        public string Description { get; set; }

        /// <summary>
        /// Indicates if the revision is the latest one
        /// </summary>
        public bool IsActive { get; set; } = true;


    }
}
