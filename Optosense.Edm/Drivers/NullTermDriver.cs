using Optosense.Edm.Domain.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Drivers
{
    [Driver(DeviceType = DeviceModel.NullTerm, OptionsType = typeof(NullTermOptions))]
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
