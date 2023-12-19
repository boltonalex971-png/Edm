using System;
using System.Collections.Generic;
using System.Composition;
using System.Linq;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using StackExchange.Redis;

namespace Microprojects.Edm.Cache
{
    [Export(typeof(ICache))]
    public class MemCache : CacheBase
    {
        private Dictionary<string, object> Storage { get; } = new Dictionary<string, object>();

        public override string Get(string key)
        {
            return Storage.ContainsKey(key) ? Storage[key].ToString() : null;
        }

        public override T Set<T>(string key, T record, TimeSpan expireAt)
        {
            string output = JsonSerializer.Serialize(record);
            Storage[key] = output;
            return record;
        }

        public override bool Remove(string key)
        {
            throw new NotImplementedException();
        }

        public override long RemoveMany(string wildcard)
        {
            throw new NotImplementedException();
        }

        public override bool Push<T>(string key, T record)
        {
            var list = Storage.ContainsKey(key) ? (List<T>) Storage[key] : null;
            if (list == null)
            {
                list = new List<T>();
                Storage[key] = list;
            }

            list.Add(record);
            return true;
        }

        public override T Pop<T>(string key)
        {
            List<T> list = (List<T>) Storage[key];
            if (list == null || list.Count == 0)
            {
                return default;
            }

            T value = list.First();
            list.RemoveAt(0);
            return value;
        }

        protected override IEnumerable<string> GetKeys(string wildcard)
        {
            var pattern = $"^{wildcard.Replace(".", "\\.").Replace("*", ".*").Replace("?", ".")}$";
            return Storage.Keys.Where(k => Regex.IsMatch(k, pattern)).ToList();
        }

        public override async Task<IEnumerable<T>> GetRangeAsync<T>(string key, int start, int stop, Func<Task<IEnumerable<T>>> locator, TimeSpan expireAt)
        {
            IEnumerable<T> list = default;
            if (Storage.ContainsKey(key))
            {
                list = Storage[key] as IEnumerable<T>;
            }
            else 
            { 
                if (locator != null)
                {
                    list = await locator();
                }
                else
                {
                    list = new List<T>();
                }
                Storage[key] = list;
            }

            var skip = start < 0 ? list.Count() + start : start;
            var take = stop < 0 ? list.Count() + stop - skip : stop;
            var range = list.Skip(skip).Take(take);
            return range;
        }
    }
}
