using System;
using System.Collections.Generic;
using System.Composition;
using System.Linq;
using System.Net;
using System.Reactive.Disposables;
using System.Reactive.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microprojects.Edm.Intercom;
using StackExchange.Redis;

namespace Microprojects.Edm.Cache.Redis
{
    public class RedisCache : CacheBase, IIntercom
    {
        private readonly Lazy<ConnectionMultiplexer> LazyConnection;
        private readonly ConnectionMultiplexer Connection;
        private readonly IDatabase Db;

        public RedisCache() : this("localhost,abortConnect=false") { }

        public RedisCache(string connectionString)
        {
            LazyConnection = new Lazy<ConnectionMultiplexer>(() => ConnectionMultiplexer.Connect(connectionString));
            Connection = LazyConnection.Value;
            Db = Connection.GetDatabase();
        }

        public override string Get(string key)
        {
            string json = Db.StringGet(key);
            if (json == null) return default;
            var expire = Db.KeyTimeToLive(key);
            if (expire != null && expire < DefaultExpiry)
            {
                Db.KeyExpire(key, DefaultExpiry);
            }
            return json;
        }

        public override T Set<T>(string key, T record, TimeSpan expireAt)
        {
            string output = JsonSerializer.Serialize(record);
            string uniqueKey = $"{key}"; 
            Db.StringSet(uniqueKey, output, expireAt, flags: CommandFlags.FireAndForget);
            return record;
        }

        public override async Task<IEnumerable<T>> GetRangeAsync<T>(string key, int start, int stop, Func<Task<IEnumerable<T>>> locator, TimeSpan expireAt)
        {
            var list = await Db.ListRangeAsync(key, start, stop).ConfigureAwait(false);
            if (list == null && locator != null)
            {
                var data = await locator();
                await Db.ListLeftPushAsync(key, data.Select(d => RedisValue.Unbox(JsonSerializer.Serialize(d))).ToArray(), When.Always, CommandFlags.FireAndForget)
                    .ConfigureAwait(false);
                await Db.KeyExpireAsync(key, expireAt, CommandFlags.FireAndForget)
                    .ConfigureAwait(false);
                return data.ToList();
            }
            else
            {
                var data = list.Select(v => JsonSerializer.Deserialize<T>(RedisValue.Unbox(v)));
                return data;
            }
        }

        public override T Pop<T>(string key)
        {
            string json = Db.ListLeftPop(key);
            if (json == null)
            {
                return default;
            }

            T value = JsonSerializer.Deserialize<T>(json);
            return value;
        }

        public override bool Push<T>(string key, T record)
        {
            string output = JsonSerializer.Serialize(record);
            RedisValue[] values = { output };
            Db.ListRightPush(key, values, flags: CommandFlags.FireAndForget);
            return true;
        }

        public override bool Remove(string key)
        {
            return Db.KeyDelete(key, flags: CommandFlags.FireAndForget);
        }

        public override long RemoveMany(string wildcard)
        {
            var keys = GetKeys(wildcard).Select(k => (RedisKey) k).ToArray();
            return Db.KeyDelete(keys, flags: CommandFlags.FireAndForget);
        }

        protected override IEnumerable<string> GetKeys(string pattern)
        {
            var hostNames = Connection.GetEndPoints().Cast<DnsEndPoint>();
            var host = hostNames.First();
            var hostName = $"{host.Host}:{host.Port}";
            return Connection.GetServer(hostName).Keys(pattern: pattern, pageSize: 1000)
                .Select(k => k.ToString())
                .ToList();
        }

        public override IDisposable Subscribe<T>(string channel, Action<T> onNext)
        {
            var obs = Observable.Create<T>(async observer =>
            {
                var obs = await Db.Multiplexer.GetSubscriber().SubscribeAsync(channel).ConfigureAwait(false);
                obs.OnMessage(message => {
                    var value = JsonSerializer.Deserialize<T>(message.Message);
                    observer.OnNext(value);
                });
                return Disposable.Create(async () => 
                {
                    await obs.UnsubscribeAsync().ConfigureAwait(false);
                });
            }).Subscribe(onNext);
            return obs;
        }

        public override IDisposable Subscribe(string channel, Action<object> onNext)
        {
            var obs = Observable.Create<object>(async observer =>
            {
                var obs = await Db.Multiplexer.GetSubscriber().SubscribeAsync(channel).ConfigureAwait(false);
                obs.OnMessage(message => observer.OnNext(message.Message));
                return Disposable.Create(async () =>
                {
                    await obs.UnsubscribeAsync().ConfigureAwait(false);
                });
            }).Subscribe(onNext);
            return obs;
        }

        public override async Task<long> Publish<T>(string channel, T message)
        {
            var value = RedisValue.Unbox(JsonSerializer.Serialize(message));
            var listeners = await Db.PublishAsync(channel, value).ConfigureAwait(false);
            return listeners;
        }
    }
}
