using Microsoft.AspNetCore.Builder;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using Microprojects.Edm.Domain;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Web;

namespace Optosense.Edm.WebApi.Utils
{
    public static class JsonConfig
    {
        public static void JsonConfigure(this IApplicationBuilder app)
        {
            JsonConvert.DefaultSettings = () => new JsonSerializerSettings
            {
                ContractResolver = new CustomResolver(),
                //PreserveReferencesHandling = PreserveReferencesHandling.None,
                
                ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                Formatting = Formatting.None,
                NullValueHandling = NullValueHandling.Ignore
            };
        }

        class CustomResolver : DefaultContractResolver
        {
            public CustomResolver() 
            { 
                //NamingStrategy = new CamelCaseNamingStrategy();
            }
            
            //protected override JsonProperty CreateProperty(MemberInfo member, MemberSerialization memberSerialization)
            //{
            //    JsonProperty prop = base.CreateProperty(member, memberSerialization);

            //    if (prop.PropertyType.IsClass && prop.PropertyType.IsInstanceOfType(typeof(DomainObject)))
            //    {
            //        prop.ShouldSerialize = obj => false;
            //    }

            //    return prop;
            //}
        }
    }
}