using Microprojects.Edm.Intercom;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.Extensions.Options;
using System;
using System.Reactive.Disposables;
using System.Reactive.Linq;
using System.Threading.Tasks;

namespace Optosense.Edm.WebApi.Utils
{
    public class EdmIntercom : IIntercom
    {
        protected HubConnection HubConnection { get; set; }
        protected IntercomOptions Options { get; init; }

        public EdmIntercom(IntercomOptions options)
        {
            Options = options;
            HubConnection = new HubConnectionBuilder()
                .WithUrl($"{Options.Principal}/{IntercomHub.Hub}")
                .WithAutomaticReconnect()
                .Build();
        }
        public async Task<long> Publish<T>(string channel, T message)
        {
            if (HubConnection.State != HubConnectionState.Connected)
            {
                await HubConnection.StartAsync();
            }

            await HubConnection.InvokeAsync(nameof(IntercomHub.Publish), channel, message);
            return 0;
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
