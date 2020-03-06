using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Optosense.Edm.Domain.Models;

namespace Optosense.Edm.Drivers
{
    public abstract class DriverBase : IDeviceDriver
    {
        public static string Ok = "Ok";

        public static double PingIntervalInSec { get; } = 10.0;
        private readonly string _empty = "Not implemented";

        public DriverOptions Options { get; set; }

        public DeviceModel GetDeviceType()
        {
            var type = GetType().GetCustomAttribute<DriverAttribute>()?.DeviceType ?? DeviceModel.None;
            return type;
        }

        public DeviceType GetEnvironmentType()
        {
            var deviceType = GetDeviceType();
            var envType = Enum.GetValues(typeof(DeviceType)).Cast<DeviceType>()
                .FirstOrDefault(e => ((int)e & (int)deviceType) != 0);
            return envType;
        }

        public virtual string Get()
        {
            return "Get";
        }

        public virtual string Init()
        {
            return "Init";
        }

        public virtual string Set(object param)
        {
            return $"Set {param}";
        }

        public virtual string Start()
        {
            return "Start";
        }

        public virtual string Stop()
        {
            return "Stop";
        }

        public virtual string Ping()
        {
            return "Ping";
        }

        public virtual string Execute(string command)
        {
            string result;
            var split = command.Split(' ');
            switch (split[0])
            {
                case nameof(this.Init):
                    result = Init();
                    break;
                case nameof(this.Start):
                    result = Start();
                    break;
                case nameof(this.Stop):
                    result = Stop();
                    break;
                case nameof(this.Set):
                    result = Set(split[1]);
                    break;
                case nameof(this.Get):
                    result = Get();
                    break;
                case nameof(this.Ping):
                    result = Ping();
                    break;
                default:
                    throw new NotImplementedException($"The driver {GetType().Name} does not contain \"{split[0]}\" method");
            };
            return result;
        }

        public virtual void Dispose()
        {
        }

        public class DeviceRequestParameters
        {
            public string Action { get; set; }
            public string Parameter { get; set; }
        }

    }

    public class DeviceDriverCommand
    {
        public string Command { get; set; }
        public string Params { get; set; }
    }

    [AttributeUsage(AttributeTargets.Class)]
    public class DriverAttribute : Attribute
    {
        public DeviceModel DeviceType { get; set; }
        public Type OptionsType { get; set; }
        public Type CommandType { get; set; }
    }
}
