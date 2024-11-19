using Microprojects.Edm.Intercom;
using Microprojects.Edm.Utils;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System;
using System.Collections;
using System.Collections.Concurrent;
using System.Net;
using System.Reactive.Disposables;
using System.Reactive.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Optosense.Edm.WebApi.Utils
{
    public class EdmIntercom : IIntercom
    {
        protected HubConnection HubConnection { get; set; }
        protected IntercomOptions Options { get; init; }
        protected ConcurrentQueue<(string, object)> Cache { get; init; } = new();

        private readonly Task _worker;
        private readonly ILogger<EdmIntercom> _logger;
        private event EventHandler _messagePublished;

        public EdmIntercom(IntercomOptions options, ILogger<EdmIntercom> logger)
        {
            Options = options;
            HubConnection = new HubConnectionBuilder()
                .WithUrl($"{Options.Principal}/{IntercomHub.Hub}")
                .WithAutomaticReconnect()
                .Build();
            _worker = Task.Factory.StartNew(BackgroundSend, TaskCreationOptions.LongRunning);
            _logger = logger;
        }

        public Task<long> Publish<T>(string channel, T message)
        {
            Cache.Enqueue((channel, message));
            // Awake BackgroundSend if sleep
            _messagePublished?.Invoke(this, EventArgs.Empty);

            return Task.FromResult<long>(0);
        }

        private async Task BackgroundSend()
        {
            await StartHubConnection(HubConnection, $"{Options.Principal}/{IntercomHub.Hub}");
            var random = new Random(DateTime.Now.Millisecond);

            // TODO add cancellation token for Intercom dispose with cached records check
            while (true)
            {
                try
                {
                    var tokenSource = new CancellationTokenSource();
                    EventHandler handler = (s, e) => tokenSource.Cancel();
                    _messagePublished += handler;
                    tokenSource.Token.Register(() => _messagePublished -= handler);
                    await Task.Delay(-1, tokenSource.Token).ContinueWith(t => { });

                    while (Cache.TryPeek(out var record))
                    {
                        await HubConnection.InvokeAsync(nameof(IntercomHub.Publish), record.Item1, record.Item2)
                            .ContinueWith(async t =>
                            {
                                if (t.IsCompletedSuccessfully)
                                {
                                    Cache.TryDequeue(out var deq);
                                }
                                else if (t.IsFaulted)
                                {
                                    var ex = t.Exception;
                                    await Task.Delay(random.Next(100, 1000));
                                    _logger.LogError("Sending message to channel {Channel} failed. Reason:\n{Reason}", record.Item1, t.Exception.GetMeaningfulMessage());
                                }
                                else
                                {
                                    var ex = t.IsCanceled;
                                    _logger.LogWarning("Sending message to channel {Channel} was cancelled", record.Item1);
                                }
                            });
                    }
                }
                catch (Exception ex) 
                { 
                    _logger.LogError("Error happened during background publishing: {Message}", ex.GetMeaningfulMessage());
                }
            }
        }

        public IDisposable Subscribe<T>(string channel, Action<T> onNext)
        {
            var obs = Observable.Create<T>(async observer =>
            {
                var connection = new HubConnectionBuilder()
                    .WithUrl($"{Options.Principal}/{IntercomHub.Hub}")
                    .WithAutomaticReconnect()
                    .Build();
                connection.Closed += async (ex) =>
                {
                    if (ex != null)
                    {
                        await StartHubConnection(connection, channel, ex);
                    }
                };
                connection.On<T>("Receive", (message) =>
                {
                    onNext(message);
                });
                await StartHubConnection(connection, channel);
                await connection.InvokeAsync(nameof(IntercomHub.Subscribe), channel);
                return Disposable.Create(async () =>
                {
                    await connection.StopAsync();
                });
            }).Subscribe(onNext);
            return obs;
        }

        public IDisposable Subscribe(string channel, Action<object> onNext)
        {
            throw new NotImplementedException();
        }

        private async Task StartHubConnection(HubConnection hub, string channel, Exception ex = null)
        {
            while (hub.State != HubConnectionState.Connected)
            {
                try
                {
                    await hub.StartAsync();
                }
                catch (Exception e)
                {
                    _logger.LogWarning("Cannot connect to hub channel {Channel} on subscribe. Reason: {Reason}", channel, e.GetMeaningfulMessage());
                }

                await Task.Delay(new Random().Next(0, 5) * 1000);
            }
        }
    }

    public class IntercomOptions
    {
        public enum Kinds
        {
            SignalR,
            Redis
        }
        public Kinds Kind { get; set; }
        public string Principal { get; set; }
        public string ConnectionString { get; set; }
    }
}
