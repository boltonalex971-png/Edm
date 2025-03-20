using AdaptiveExpressions;
using Microprojects.Edm;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Newtonsoft.Json;
using Optosense.Edm.Domain.Models;
using Optosense.Edm.Drivers.Mux;
using Optosense.Edm.Drivers.OpcUa;
using Optosense.Edm.Profiles.Board;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Linq.Expressions;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using JsonSerializer = System.Text.Json.JsonSerializer;

namespace Optosense.Edm.Test
{
    [TestClass]
    public class AnyTest
    {
        [TestMethod]
        public void JsonDictionaryTest()
        {
            var dic = new Dictionary<string, object> { { "a", 1 }, { "b", "qqq" } };
            var text = JsonSerializer.Serialize(dic, new JsonSerializerOptions
            {

            });
            var revert = JsonSerializer.Deserialize<Dictionary<string, Object>>(text);
        }

        [TestMethod]
        public void ValueComparerTest()
        {
            var dic1 =  new Dictionary<string, object> { { "a", 1 }, { "b", "qqq" } };
            var dic2 =  new Dictionary<string, object> { { "a", 1 }, { "b", "qqq" } };
            var comparer = ValueCompare.CreateDefault<Dictionary<string, object>>(true);
        }
    }
}
