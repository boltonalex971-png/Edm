using System;
using System.Threading.Tasks;
using System.Threading;
using Microprojects.Edm.Cache;
using Microprojects.Edm.Log;
using System.Linq;
using Microprojects.Edm;
using Microsoft.Extensions.Options;
using Microprojects.Edm.Jobs;

namespace Optosense.Edm.Jobs
{
    [Job(Name = "ImAlive", Lifetime = JobLifetime.Permanent, Parameters = typeof(ImAliveJobParameters))]
    public class ImAliveJob : BaseJob
    {
        protected ICache Cache { get; init; }
        protected IJobContainer Container { get; init; }
        protected IOptions<Peer> PeerOptions { get; init; }
        protected ImAliveJobParameters Parameters => (ImAliveJobParameters) JobParameters;

        public ImAliveJob() { }
        public ImAliveJob(ICache cache, IJobContainer container, IOptions<Peer> options)
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

    public class ImAliveJobParameters : IJobParameters
    {
        public string Channel { get; set; } = "Edm-Lifecicle";
    }
}


