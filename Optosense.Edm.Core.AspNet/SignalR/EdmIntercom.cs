using Microprojects.Edm.Intercom;
using Microprojects.Edm.Utils;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
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
        private event EventHandler MessagePublished;

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
            MessagePublished?.Invoke(this, EventArgs.Empty);

            return Task.FromResult<long>(0);
        }

        private async Task BackgroundSend()
        {
            var random = new Random(DateTime.UtcNow.Millisecond);

            // TODO add cancellation token for Intercom dispose with cached records check
            CancellationTokenSource tokenSource = null;
            while (true)
            {
                try
                {
                    if (tokenSource is null || tokenSource.TryReset() == false)
                    {
                        tokenSource = new CancellationTokenSource();
                        EventHandler handler = (s, e) => tokenSource.Cancel();
                        MessagePublished += handler;
                        tokenSource.Token.Register(() => MessagePublished -= handler);
                    }

                    await Task.Delay(1000, tokenSource.Token).ContinueWith(t => { });

                    while (Cache.TryPeek(out var record))
                    {
                        if (HubConnection.State != HubConnectionState.Connected)
                        {
                            await StartHubConnection(HubConnection, $"{Options.Principal}/{IntercomHub.Hub}");
                        }

                        await HubConnection.InvokeAsync(nameof(IntercomHub.Publish), record.Item1, record.Item2)
                            .ContinueWith(async t =>
                            {
                                if (t.IsCompletedSuccessfully)
                                {
                                    Cache.TryDequeue(out var deq);
                                }
                                else if (t.IsFaulted)
                                {
                                    _logger.LogError("Sending message to channel {Channel} failed.\nPayload: {Data}\nReason: {Reason}",
                                        record.Item1, JsonConvert.SerializeObject(record.Item2), t.Exception.GetMeaningfulMessage());

                                    // TODO Detect service packets to avoid collecting them in cache
                                    if (record.Item1.Contains("Edm-Lifecycle"))
                                    {
                                        Cache.TryDequeue(out var deq);
                                    }

                                    await Task.Delay(random.Next(100, 1000));
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

        public IDisposable Subscribe<T>(string channel, 
            Action<T> onNext, 
            Action<Exception> onError = null, 
            Action onCompleted = null)
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
                        observer.OnError(ex);
                        await StartHubConnection(connection, channel, ex);
                    }
                    else
                    {
                        observer.OnCompleted();
                    }
                };
                connection.On<T>("Receive", onNext);
                await StartHubConnection(connection, channel);
                await connection.InvokeAsync(nameof(IntercomHub.Subscribe), channel);
                return Disposable.Create(async () =>
                {
                    await connection.StopAsync();
                });
            }).Subscribe(onNext, onError ?? NoError, onCompleted ?? NoCompleted);

            return obs;

            void NoCompleted() => _logger.LogInformation("Subscription to {Channel} completed successfully", channel);
            void NoError(Exception ex) => _logger.LogInformation("Subscription to {Channel} failed: \n\n{Exception}", channel, ex.GetFullInfo());
        }

        public IDisposable Subscribe(string channel, Action<object> onNext)
        {
            throw new NotImplementedException();
        }

        private async Task StartHubConnection(HubConnection hub, string channel, Exception ex = null)
        {
            if (ex is null)
            {
                _logger.LogInformation("Connecting to hub channel {Channel}", channel);
            }
            else
            {
                _logger.LogWarning("Reconnecting to hub channel {Channel} after failure:\n\n{Exception}", 
                    channel, ex.GetFullInfo());
            }
            while (hub.State != HubConnectionState.Connected)
                {
                    try
                    {
                        if (hub.State == HubConnectionState.Disconnected)
                        {
                            await hub.StartAsync();
                        }
                        else
                        {
                            await Task.Delay(new Random().Next(0, 5) * 1000);
                        }
                    }
                    catch (Exception e)
                    {
                        _logger.LogWarning("Cannot connect to hub channel {Channel} on subscribe. Reason: {Reason}", channel, e.GetMeaningfulMessage());
                    }
                }

            _logger.LogInformation("Successfully connected to hub channel {Channel}", channel);
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
