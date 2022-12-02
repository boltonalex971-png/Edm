using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Microprojects.Edm.Drivers
{
    public interface IReactiveDriver
    {
       Func<DriverResponse, bool, Task> PushResponse { get; set; }
    }
}
