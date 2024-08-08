using Microprojects.Edm.Intercom;
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
        private event EventHandler _messagePublished;

        public EdmIntercom(IntercomOptions options)
        {
            Options = options;
            HubConnection = new HubConnectionBuilder()
                .WithUrl($"{Options.Principal}/{IntercomHub.Hub}")
                .WithAutomaticReconnect()
                .Build();
            _worker = Task.Factory.StartNew(BackgroundSend, TaskCreationOptions.LongRunning);
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
            await HubConnection.StartAsync();
            var random = new Random(DateTime.Now.Millisecond);

            // TODO add cancellation token for Intercom dispose with cached records check
            while (true)
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
                                //Logger.LogError("Message failed:\n{message}\nTo channel:\n{channel}\nError:\n{error}", message, channel, t.Exception.GetFullInfo());
                            }
                            else
                            {
                                var ex = t.IsCanceled;
                                //Logger.LogDebug("Message cancelled:\n{message}\nTo channel:\n{channel}", message, channel);
                            }
                        });
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
                    if (ex is not null)
                    {
                        await Task.Delay(new Random().Next(0, 5) * 1000);
                        await connection.StartAsync();
                    }
                };
                connection.On<T>("Receive", (message) =>
                {
                    onNext(message);
                });
                await connection.StartAsync();
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
