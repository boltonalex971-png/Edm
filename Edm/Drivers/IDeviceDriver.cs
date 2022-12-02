using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Microprojects.Edm.Drivers
{
    public interface IDeviceDriver
    {
        IDriverOptions Options { get; set; }

        string Init();
        string Start();
        string Stop();
        string Set(object param);
        string Get();
        string Ping();
        Task<DriverResponse> Execute(DriverRequest request);
        IDriverOptions GetEffectiveOptions();
    }

    public interface IProfilable
    {
        IEnumerable<(double Value, TimeSpan Offset)> Profile { get; set; }
    }

    public interface IDriverOptions
    {
    }

    public class DriverOptions : IDriverOptions
    { 
    }
}
