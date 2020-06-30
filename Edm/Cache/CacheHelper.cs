using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microprojects.Edm.Cache.Redis;

namespace Microprojects.Edm.Cache
{
    public static class CacheHelper
    {
        private static ICache _cache;
        private static ICache _spare;

        // TODO make cache initialization configurable from application.json
        public static ICache GetInstance()
        {
            _cache = _cache ?? new RedisCache();
            return _cache;
            //return new RedisCache();
        }

        public static ICache GetSpareCache()
        {
            _spare = _spare ?? new MemCache();
            return _spare;
        }
    }
}
