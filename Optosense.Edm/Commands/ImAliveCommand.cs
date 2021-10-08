using System;
using System.Threading.Tasks;
using System.Threading;
using Microprojects.Edm.Cache;
using Microprojects.Edm.Log;
using System.Linq;
using Microprojects.Edm;
using Microprojects.Edm.Commands;
using Microsoft.Extensions.Options;

namespace Optosense.Edm.Commands
{
    [Command(Name = "ImAlive", Lifetime = CommandType.Permanent, Parameters = typeof(ImAliveCommandParameters))]
    public class ImAliveCommand : BaseCommand
    {
        protected ICache Cache { get; init; }
        protected ICommandContainer Container { get; init; }
        protected IOptions<Peer> PeerOptions { get; init; }
        protected ImAliveCommandParameters Parameters => (ImAliveCommandParameters) CommandParameters;

        public ImAliveCommand() { }
        public ImAliveCommand(ICache cache, ICommandContainer container, IOptions<Peer> options)
        {
            Cache = cache;
            Container = container;
            PeerOptions = options;
        }

        public override async Task<object> ExecuteAsync()
        {
            // Listen "ImAlive" messages
            var listener = Cache.Subscribe<Peer>(Parameters.Channel,
                onNext: h =>
                {
                    //Logger.Log($"Got imalive message: {h.Host} {h.Version} {h.Timestamp}");
                    var host = Container.Hive.TouchPeer(h);
                });
            var issuer = new Timer((state) =>
            {
                PeerOptions.Value.Timestamp = DateTime.Now;
                Cache.Publish(Parameters.Channel, PeerOptions.Value);
            }, null, 0, (int)Container.Hive.Alive.TotalMilliseconds);
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


