using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Microprojects.Edm.Drivers
{
    public interface IParamProvider
    {
        Task<DriverResponse> GetParam(string parameterName);
    }
}
