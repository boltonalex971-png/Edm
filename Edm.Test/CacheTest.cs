using Microprojects.Edm.Cache;
using Microprojects.Edm.Cache.Redis;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Edm.Test
{
    [TestClass]
    public class CacheTest
    {
        [TestMethod]
        public async Task SubscribeTest()
        {
            var cache = new RedisCache();
            var responses = new List<int>();
            var listeners = new List<long>();

            using var subs = cache.Subscribe<int>("test", response => responses.Add(response) );

            for (int i = 0; i < 1000; i++)
            {
                //await Task.Delay(1000);
                var listen = await cache.Publish("test", i);
                listeners.Add(listen);
            }

            Assert.IsFalse(responses.Select((r, i) => (r, i)).Any(t => t.r != t.i) || listeners.Any(l => l == 0));
        }
    }
}
