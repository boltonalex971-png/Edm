using Microprojects.Edm;
using Microprojects.Edm.Intercom;
using Microprojects.Edm.Jobs;
using Microsoft.Extensions.Options;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Optosense.Edm.Jobs
{
    [Job(Name = "ImAlive", Lifetime = JobLifetime.Permanent, Parameters = typeof(ImAliveJobParameters))]
    public class ImAliveJob : BaseJob
    {
        protected IIntercom Intercom { get; init; }
        protected IJobContainer Container { get; init; }
        protected IOptions<Peer> PeerOptions { get; init; }
        protected ImAliveJobParameters Parameters => (ImAliveJobParameters)JobParameters;

        public ImAliveJob() { }
        public ImAliveJob(IIntercom intercom, IJobContainer container, IOptions<Peer> options)
        {
            Intercom = intercom;
            Container = container;
            PeerOptions = options;
        }

        public override async Task<object> ExecuteAsync()
        {
            // Listen "ImAlive" messages
            var listener = Intercom.Subscribe<Peer>(Parameters.Channel,
                onNext: h =>
                {
                    //Logger.Log($"Got imalive message: {h.Host} {h.Version} {h.Timestamp}");
                    var host = Container.Hive.TouchPeer(h);
                });
            var issuer = new Timer(async state =>
            {
                PeerOptions.Value.Timestamp = DateTime.Now;
                await Intercom.Publish(Parameters.Channel, PeerOptions.Value);
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
        public string Channel { get; set; } = "Edm-Lifecycle";
    }
}


