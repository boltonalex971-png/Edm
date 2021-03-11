using Microprojects.Edm.Drivers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Drivers
{
    [Driver(OptionsType = typeof(NullTermOptions))]
    public class NullTermDriver : DriverBase
    {
        public NullTermDriver() 
        {
            Options = new NullTermOptions();
        }

        public class NullTermOptions : DriverOptions
        {
        }
    }
}
