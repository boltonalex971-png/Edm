using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Core.Persistance
{
    public interface IEdmContextFactory
    {
        IEdmContext Create();
    }
}
