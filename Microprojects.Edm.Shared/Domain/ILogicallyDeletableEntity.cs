using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Microprojects.Edm.Domain
{
    public interface ILogicallyDeletableEntity
    {
        bool IsActive { get; set; }
    }
}
