using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Microprojects.Edm.Cache
{
    public interface ICache
    {
        T Set<T>(string key, T record);

        T Set<T>(string key, Func<T> locator);

        T Set<T>(string key, T record, TimeSpan expireAt);

        T Set<T>(string key, Func<T> locator, TimeSpan expireAt);

        T Get<T>(string key);

        T Get<T>(string key, Func<T> locator);

        Task<T> GetAsync<T>(string key, Func<Task<T>> locator);

        string Get(string key);

        IEnumerable<T> GetMany<T>(string wildcard);

        IEnumerable<string> GetMany(string wildcard);

        bool Remove(string key);

        long RemoveMany(string wildcard);

        bool Push<T>(T record);

        T Pop<T>();

        //IObservable<T> Subscribe<T>();

        //void Unsubscribe();
    }
}
