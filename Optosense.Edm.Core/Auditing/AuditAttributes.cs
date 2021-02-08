using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Core.Auditing
{
    [AttributeUsage(AttributeTargets.Method)]
    public class AuditFuncAttribute : Attribute
    {
        public string Name { get; set; }
        public string Description { get; set; }
        public string Format { get; set; }

    }

    [AttributeUsage(AttributeTargets.Method, AllowMultiple = true)]
    public class AuditArgAttribute : Attribute
    {
        public AuditArgAttribute(string name, Type type)
        {
            Name = name;
            Type = type;
        }

        public string Name { get; set; }
        public Type Type { get; set; }
    }
}
