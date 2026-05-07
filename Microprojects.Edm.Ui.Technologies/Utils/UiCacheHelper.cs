using Microprojects.Edm.Cache;
using Microsoft.AspNetCore.Mvc;
using Microprojects.Edm.Ui.Technologies.Models;
using Microprojects.Edm.Ui.Technologies.Models;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Web;

namespace Optosense.Istp.WebUi.Utils
{
    public static class UiCacheHelper
    {
        /// <summary>
        /// Root node for cache of controllers
        /// </summary>
        private const string Root = "UI";
        /// <summary>
        /// Expiration period in days
        /// </summary>
        private const int Expiration = 30;

        # region cache keys

        public static Func<Controller, string> OwnerKey { get; } = 
            controller => controller.User.Identity.IsAuthenticated ? controller.User.Identity.Name : controller.HttpContext.Session.Id;
        public static Func<HierarchyType, string> TreeExpandedStatusKey { get; } = 
            type => $"{Root}:{typeof(Type).Name}:{type}";

        #endregion


        public static void Store<T>(this ICache cache, string owner, T value, params Func<T, object>[] idSelectors)
        {
            var ids = string.Join(":", idSelectors.Select(s => s(value).ToString()));
            cache.Set($"{owner}:{typeof(T).Name}:{ids}", value, TimeSpan.FromDays(Expiration));
        }

        public static void StoreMany<T>(this ICache cache, string owner, IEnumerable<T> values, params Func<object>[] idSelectors)
        {
            var ids = string.Join(":", idSelectors.Select(s => s().ToString()));
            cache.Set($"{owner}:{typeof(T).Name}:{ids}", values, TimeSpan.FromDays(Expiration));

            //foreach (var value in values)
            //{
            //    var ids = string.Join(":", idSelectors.Select(s => s(value).ToString()));
            //    cache.Set($"{owner}:{typeof(T).Name}:{ids}", value, TimeSpan.FromDays(Expiration));
            //}
        }

        public static T Restore<T>(this ICache cache, string owner, params Func<object>[] idSelectors)
        {
            var ids = string.Join(":", idSelectors.Select(s => s().ToString()));
            var value = cache.Get<T>($"{owner}:{typeof(T).Name}:{ids}");
            return value;
        }

        public static IEnumerable<T> RestoreMany<T>(this ICache cache, string owner, params Func<object>[] idSelectors)
        {
            var ids = string.Join(":", idSelectors.Select(s => s().ToString()));
            var values = cache.Get<IEnumerable<T>>($"{owner}:{typeof(T).Name}:{ids}");
            return values;
        }

        //public static string GetTreeExpandedStatuses(this ICache cache, string owner, HierarchyType type)
        //{
        //    return cache.GetMany
        //}
    }
}