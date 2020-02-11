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

        public override bool Push<T>(T record)
        {
            var key = typeof(T).FullName;
            string output = JsonSerializer.Serialize(record);
            var list = Storage.ContainsKey(key) ? (LinkedList<string>) Storage[key] : null;
            if (list == null)
            {
                list = new LinkedList<string>();
                Storage[key] = list;
            }
            list.AddLast(output);
            return true;
        }

        public override T Pop<T>()
        {
            string listName = typeof(T).FullName;
            LinkedList<string> list = (LinkedList<string>) Storage[listName];
            if (list == null || list.Count == 0)
            {
                return default;
            }
            string json = list.First();
            list.RemoveFirst();
            T value = JsonSerializer.Deserialize<T>(json);
            return value;
        }

        //public override IObservable<T> Subscribe<T>()
        //{
        //    throw new NotImplementedException();
        //}

        //public override void Unsubscribe()
        //{
        //    throw new NotImplementedException();
        //}

        protected override IEnumerable<string> GetKeys(string wildcard)
        {
            var pattern = $"^{wildcard.Replace(".", "\\.").Replace("*", ".*").Replace("?", ".")}$";
            return Storage.Keys.Where(k => Regex.IsMatch(k, pattern)).ToList();
        }
    }
}
