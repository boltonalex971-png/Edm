using Microprojects.Edm.Drivers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Microprojects.Edm.Drivers
{
    [Driver(OptionsType = typeof(NullGasOptions))]
    public class NullGasDriver : DriverBase
    {
        public NullGasDriver() 
        {
            Options = new NullGasOptions();
        }
        
        public class NullGasOptions : IDriverOptions
        {
        }
    }
}
