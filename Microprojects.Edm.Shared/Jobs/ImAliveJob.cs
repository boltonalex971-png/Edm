using Microprojects.Edm;
using Microprojects.Edm.Intercom;
using Microprojects.Edm.Jobs;
using Microsoft.Extensions.Options;
using System;
using System.Threading;
using System.Threading.Tasks;
using Microprojects.Edm.Utils;
using Microsoft.Extensions.Logging;

namespace Microprojects.Edm.Jobs
{
    [Job(Name = "ImAlive", Lifetime = JobLifetime.Permanent, Parameters = typeof(ImAliveJobParameters))]
    public class ImAliveJob : BaseJob
    {
        protected IIntercom Intercom { get; init; }
        protected IJobContainer Container { get; init; }
        protected IOptions<Peer> PeerOptions { get; init; }
        protected ILogger<ImAliveJob> Logger { get; init; }
        protected ImAliveJobParameters Parameters => (ImAliveJobParameters)JobParameters;

        public ImAliveJob() { }
        public ImAliveJob(IIntercom intercom, IJobContainer container, IOptions<Peer> options, ILogger<ImAliveJob> logger)
        {
            Intercom = intercom;
            Container = container;
            PeerOptions = options;
            Logger = logger;
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
                PeerOptions.Value.Timestamp = DateTime.UtcNow;
                Exception ex = null;
                await Intercom.Publish(Parameters.Channel, PeerOptions.Value)
                    .ContinueWith(t =>
                    {
                        if (t.IsFaulted && (ex == null || t.Exception.GetType() != ex.GetType()))
                        {
                            ex = t.Exception;
                            Logger.LogWarning("Could not publish message.\n{Exception}",
                                t.Exception.GetMeaningfulMessage());
                            return;
                        }
                        
                        if (t.IsCompleted && ex != null)
                        {
                            Logger.LogInformation("Back to normal state after {Exception}", ex.GetType());
                            ex = null;
                        }
                    });
            }, null, 0, (int)Container.Hive.Alive.TotalMilliseconds);
            try
            {
                await Task.Delay(-1, CancellationToken);
            }
            finally
            {
                listener.Dispose();
                await issuer.DisposeAsync();
            }

            return "Ok";
        }
    }

    public class ImAliveJobParameters : IJobParameters
    {
        public string Channel { get; set; } = "Edm-Lifecycle";
    }
}


