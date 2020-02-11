using System;
using System.Collections.Generic;
using System.Composition;
using System.Linq;
using System.Net;
using System.Text.Json;
using System.Threading.Tasks;
using StackExchange.Redis;

namespace Microprojects.Edm.Cache.Redis
{
    [Export(typeof(ICache))]
    public class RedisCache : CacheBase
    {
        private IDatabase Db { get; } = RedisHelper.Database;

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

        public override T Pop<T>()
        {
            string listName = typeof(T).FullName;
            string json = Db.ListLeftPop(listName);
            if (json == null)
            {
                return default;
            }
            T value = JsonSerializer.Deserialize<T>(json);
            return value;
        }

        public override bool Push<T>(T record)
        {
            string listName = typeof(T).FullName;
            string output = JsonSerializer.Serialize(record);
            RedisValue[] values = { output };
            Db.ListRightPush(listName, values, flags: CommandFlags.FireAndForget);
            return true;
        }

        //public override IObservable<T> Subscribe<T>()
        //{
        //    return Observable.Create<T>(async (observer, ct) =>
        //        {
        //            RedisChannel channel = new RedisChannel("__keyspace@0__:*", RedisChannel.PatternMode.Pattern);
        //            ISubscriber subscriber = RedisHelper.Connection.GetSubscriber();
        //            await subscriber.SubscribeAsync(channel, (ch, value) =>
        //            {
        //                Logger.Log($"{ch} :: {value}");
        //                T obj = JsonConvert.DeserializeObject<T>(value);
        //                observer.OnNext(obj);
        //            });

        //            return Disposable.Create(() => subscriber.Unsubscribe(channel));
        //        });
        //}

        //public override void Unsubscribe()
        //{
        //    throw new NotImplementedException();
        //}

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
            var hostNames = RedisHelper.Connection.GetEndPoints().Cast<DnsEndPoint>();
            var host = hostNames.First();
            var hostName = $"{host.Host}:{host.Port}";
            return RedisHelper.Connection.GetServer(hostName).Keys(pattern: pattern, pageSize: 1000)
                .Select(k => k.ToString())
                .ToList();
        }
    }
}
