using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;
using Optosense.Edm.Domain.Models;
using Optosense.Edm.Drivers;

namespace Optosense.Edm.Utils
{
    public static class DriverUtils
    {
        public static DriverBase GetDriver(DeviceModel deviceType)
        {
            var assembly = typeof(IDeviceDriver).Assembly;
            Type type = assembly.GetTypes()
                .FirstOrDefault(t =>
                    typeof(IDeviceDriver).IsAssignableFrom(t) &&
                    t.GetCustomAttribute<DriverAttribute>()?.DeviceType == deviceType)
                ?? throw new Exception($"No driver found for device type {deviceType}");
            var instance = Activator.CreateInstance(type);
            return (DriverBase)instance;
        }

        public static DriverOptions GetDriverOptions(DeviceModel deviceType)
        {
            var assembly = typeof(IDeviceDriver).Assembly;
            Type type = assembly.GetTypes()
                            .FirstOrDefault(t =>
                                typeof(IDeviceDriver).IsAssignableFrom(t) &&
                                t.GetCustomAttribute<DriverAttribute>()?.DeviceType == deviceType)
                           .GetCustomAttribute<DriverAttribute>().OptionsType
                        ?? typeof(DriverOptions);
            var instance = Activator.CreateInstance(type) as DriverOptions;

            return instance;
        }
    }
}