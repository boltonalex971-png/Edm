using Microprojects.Edm.Jobs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Microprojects.Edm.Drivers
{
    public interface IContainDriver : IKnowOperation
    {
        Guid GetDriverGuid();
        IDeviceDriver GetDriver();
        string GetProfile();
    }
}
