using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Optosense.Edm.Domain.Models;

namespace Optosense.Edm.Drivers
{
    [Driver(DeviceType = DeviceModel.NullGas, OptionsType = typeof(NullGasOptions))]
    public class NullGasDriver : DriverBase
    {
        public NullGasDriver() 
        {
            Options = new NullGasOptions();
        }
        
        public class NullGasOptions : DriverOptions
        {
        }
    }
}
