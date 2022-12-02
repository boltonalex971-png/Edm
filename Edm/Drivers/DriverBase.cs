using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace Microprojects.Edm.Drivers
{
    public class DriverBase : IDeviceDriver
    {
        protected const string OK = "Ok";
        protected const string EMPTY = "Not implemented";

        public static double PingIntervalInSec { get; } = 10.0;

        public IDriverOptions Options { get; set; }

        public virtual IDriverOptions GetEffectiveOptions()
        {
            var options = Options;
            if (options is null)
            {
                var optionsType = GetType().GetCustomAttribute<DriverAttribute>(true)?.OptionsType;
                options = optionsType is not null ? 
                    (IDriverOptions) Activator.CreateInstance(optionsType) :
                    new DriverOptions();
            }

            return options;
        }

        public virtual string Get() => "Get";
        public virtual string Init() => "Init";
        public virtual string Set(object param) => $"Set {param?.ToString() ?? string.Empty}";
        public virtual string Start() => "Start";
        public virtual string Stop() => "Stop";
        public virtual string Ping() => "Ping";

        public virtual Task<DriverResponse> Execute(DriverRequest request)
        {
            var response = new DriverResponse { Planned = request.Offset, Executed = request.Offset, Parameters = request.Parameters };
            var split = request.Command.Split(' ');
            response.Request = split[0];
            response.Response = response.Request switch
            {
                nameof(this.Init) => Init(),
                nameof(this.Start) => Start(),
                nameof(this.Stop) => Stop(),
                nameof(this.Set) => Set(split[1]),
                nameof(this.Get) => Get(),
                nameof(this.Ping) => Ping(),
                _ => throw new NotImplementedException($"The driver {GetType().Name} does not contain \"{split[0]}\" method")
            };
            
            return Task.FromResult(response);
        }
    }
}
