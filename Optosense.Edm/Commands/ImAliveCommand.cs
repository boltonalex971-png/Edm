using System;
using System.Threading.Tasks;
using System.Threading;
using Microprojects.Edm.Cache;
using Microprojects.Edm.Log;
using System.Linq;
using Microprojects.Edm;
using Microprojects.Edm.Commands;

namespace Optosense.Edm.Commands
{
    [Command(Name = "ImAlive", Lifetime = CommandType.Permanent, Parameters = typeof(ImAliveCommandParameters))]
    public class ImAliveCommand : BaseCommand
    {
        protected ICache Cache { get; init; }
        protected ICommandContainer Container { get; init; }
        protected ImAliveCommandParameters Parameters => (ImAliveCommandParameters) CommandParameters;

        public ImAliveCommand() { }
        public ImAliveCommand(ICache cache, ICommandContainer container)
        {
            Cache = cache;
            Container = container;
        }

        public override async Task<object> ExecuteAsync()
        {
            // Listen "ImAlive" messages
            var listener = Cache.Subscribe<EdmHost>(Parameters.Channel,
                onNext: h =>
                {
                    //Logger.Log($"Got imalive message: {h.Host} {h.Version} {h.Timestamp}");
                    var host = Container.Hive.FirstOrDefault(s => s.Host == h.Host);
                    if (host is null)
                    {
                        Container.Hive.Add(h);
                    }
                    else
                    {
                        host.Timestamp = h.Timestamp;
                    }
                });
            var host = new EdmHost
            {
                Host = "http://mp-bolotin",
                GrpcPort = 16333,
                UiPortl = 16331,
                Version = GetType().Assembly.GetName().Version.ToString()
            };
            var issuer = new Timer((state) =>
            {
                host.Timestamp = DateTime.Now;
                Cache.Publish(Parameters.Channel, host);
            }, null, 0, 10000);
            try
            {
                await Task.Delay(-1, CancellationToken);
            }
            finally
            {
                listener.Dispose();
                issuer.Dispose();
            }

            return "Ok";
        }
    }

    public class ImAliveCommandParameters : ICommandParameters
    {
        public string Channel { get; set; } = "Edm-Lifecicle";
    }
}


