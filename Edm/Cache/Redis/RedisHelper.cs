using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using StackExchange.Redis;

namespace Microprojects.Edm.Cache.Redis
{
    public static class RedisHelper
    {
        // WARNING! always use "abortConnect=false" in connection string 
        private static readonly Lazy<ConnectionMultiplexer> LazyConnection = 
            new Lazy<ConnectionMultiplexer>(() => ConnectionMultiplexer.Connect("localhost,abortConnect=false"));

        public static ConnectionMultiplexer Connection => LazyConnection.Value;

        internal static IDatabase Database => Connection.GetDatabase();

        //public static IObservable<RedisValue> WhenMessageReceived<T>(this ISubscriber subscriber, RedisChannel channel)
        //{
        //    return Observable.Create<RedisValue>(async (obs, ct) =>
        //    {
        //        await subscriber.SubscribeAsync(channel, (ch, message) =>
        //        {
        //            obs.OnNext(message);
        //        }).ConfigureAwait(false);

        //        return Disposable.Create(() => subscriber.Unsubscribe(channel));
        //    });
        //}
    }
}
