using System;
using System.Collections.Concurrent;
using System.Reactive.Disposables;
using System.Threading.Tasks;
using Newtonsoft.Json;
using Microprojects.Edm.Intercom.Events;

namespace Microprojects.Edm.Intercom;
public static class IntercomExtensions
{
    public delegate Task IntercomEvent<in TData>(TData data);
    private static ConcurrentDictionary<string, EventProvider> _channels = new();

    public static readonly Func<object, string> IntercomOperationChannel = (id) => $"Operation-{id}";
    private static readonly Func<object, string> DeviceResponses = (id) => IntercomOperationChannel(id);
    private static readonly Func<object, string> Lifecycle = (id) => $"{DeviceResponses(id)}-lifecycle";
    private static readonly Func<object, string> Parameters = (id) => $"{DeviceResponses(id)}-parameters";

    extension(IIntercom intercom)
    {
        public IDisposable Handle<T>(string channel, IntercomEvent<T> action)
        {
            Task Eh(object e) => action((T)e);
            if (_channels.TryGetValue(channel, out var handler))
            {
                handler.Arrived += Eh;
            }
            else
            {
                handler = new EventProvider();
                var subscriber = intercom.Subscribe<object>(channel,
                    onNext: json =>
                    {
                        handler.Arrived?.Invoke(JsonConvert.DeserializeObject<T>(json?.ToString() ?? "{}"));
                    });
                handler.Subscription = subscriber;
                handler.Arrived += Eh;
                _channels.TryAdd(channel, handler);
            }
            
            return Disposable.Create(() =>
            {
                handler.Arrived -= Eh;
                if (handler.HasHandlers) 
                    return;
                if (_channels.TryRemove(channel, out var removed))
                {
                    removed.Subscription.Dispose();
                }
            });
        }

        public (object id, IIntercom intercom) UseId(object id) => (id, intercom);
        
        public async Task PublishLifecycleAsync(object id, LifecycleEvent args) =>
            await intercom.Publish(Lifecycle(id), args);

        public async Task PublishParameterAsync(object id, ParameterEvent args) =>
            await intercom.Publish(Parameters(id), args);
        
        public async Task PublishDeviceResponseAsync(object id, DeviceResponseEvent args) =>
            await intercom.Publish(DeviceResponses(id), args);
    }

    extension((object id, IIntercom intercom) op)
    {
        public IDisposable HandleLifecycle(IntercomEvent<LifecycleEvent> action) => 
            op.intercom.Handle(Lifecycle(op.id), action); 
        public IDisposable HandleParameter(IntercomEvent<ParameterEvent> action) => 
            op.intercom.Handle(Parameters(op.id), action); 
        public IDisposable HandleDeviceResponse(IntercomEvent<DeviceResponseEvent> action) => 
            op.intercom.Handle(DeviceResponses(op.id), action); 
    }

    private class EventProvider 
    {
        public IntercomEvent<object> Arrived;
        public IDisposable Subscription { get; set; }
        public bool HasHandlers => Arrived != null;
    }
}