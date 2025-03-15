using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text.Json;
using System.Threading.Tasks;
using StackExchange.Redis;

namespace Microprojects.Edm.Cache
{
    public abstract class CacheBase : ICache
    {
        protected TimeSpan DefaultExpiry { get; } = TimeSpan.FromDays(10);

        public abstract string Get(string key);

        public abstract Task<IEnumerable<T>> GetRangeAsync<T>(string key, int start, int stop, Func<Task<IEnumerable<T>>> locator, TimeSpan expireAt);

        public abstract T Set<T>(string key, T record, TimeSpan expireAt);

        public abstract bool Remove(string key);

        public abstract long RemoveMany(string wildcard);

        public T Pop<T>() => Pop<T>(typeof(T).FullName);

        public abstract T Pop<T>(string key);

        public bool Push<T>(T record) => Push(record.GetType().FullName, record);

        public abstract bool Push<T>(string key, T record);

        //public abstract IObservable<T> Subscribe<T>();

        //public abstract void Unsubscribe();

        protected abstract IEnumerable<string> GetKeys(string wildcard);

        public Task<IEnumerable<T>> GetRangeAsync<T>(string key, Func<Task<IEnumerable<T>>> locator, TimeSpan expireAt) =>
            GetRangeAsync<T>(key, 0, -1, locator, expireAt);

        public T Get<T>(string key)
        {
            string json = Get(key);
            T value = json != null ? JsonSerializer.Deserialize<T>(json) : default;
            return value;
        }

        public T Get<T>(string key, Func<T> locator)
        {
            T value = Get<T>(key);
            if (value == null)
            {
                value = Set(key, locator());
            }
            return value;
        }

        public async Task<T> GetAsync<T>(string key, Func<Task<T>> locator)
        {
            T value = Get<T>(key);
            if (value == null)
            {
                value = Set(key, await locator());
            }
            return value;
        }

        public T Set<T>(string key, T record)
        {
            return Set(key, record, DefaultExpiry);
        }

        public T Set<T>(string key, Func<T> locator)
        {
            return Set(key, locator(), DefaultExpiry);
        }

        public T Set<T>(string key, Func<T> locator, TimeSpan expireAt)
        {
            return Set(key, locator(), DefaultExpiry);
        }

        public IEnumerable<T> GetMany<T>(string wildcard)
        {
            var keys = GetKeys(wildcard);
            var result = keys.Select(Get<T>).ToList();
            return result;
        }

        public IEnumerable<string> GetMany(string wildcard)
        {
            var keys = GetKeys(wildcard);
            var result = keys.Select(k => Get(k.ToString())).ToList();
            return result;
        }
    }
}
