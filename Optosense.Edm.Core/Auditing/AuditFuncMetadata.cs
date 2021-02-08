using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Core.Auditing
{
    public class AuditFuncMetadata
    {
        public AuditFuncMetadata(MethodInfo info)
        {
            var func = info.GetCustomAttribute<AuditFuncAttribute>() ?? 
                throw new ArgumentException("Method is not representing audit function");
            var args = info.GetCustomAttributes<AuditArgAttribute>();
            Name = func.Name;
            Description = func.Description;
            Format = func.Format;
            Args = args.Select(a => new AuditArgMetadata { Name = a.Name, Type = a.Type.Name }).ToList();
        }

        public string Name { get; set; }
        public string Description { get; set; }
        public string Format { get; set; }
        public IEnumerable<AuditArgMetadata> Args { get; set; }
    }

    public class AuditArgMetadata
    {
        public string Name { get; set; }
        public string Type { get; set; }
    }
}
