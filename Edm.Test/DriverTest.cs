using Microsoft.VisualStudio.TestTools.UnitTesting;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Dynamic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Edm.Test
{
    [TestClass]
    public class DriverTest
    {
        [TestMethod]
        public void ParametersTest()
        {
            var a = new ExpandoObject();
            a.TryAdd("ADDR", 1);
            var b = new ExpandoObject();
            a.TryAdd("ADDR", null);
            a.TryAdd("Some", null);
            var c = a.Union(b);

            var d = new Dictionary<string, object> { { "ADDR", 1 } };
            var e = new Dictionary<string, object> { { "ADDR", null }, { "Some", null} };

            var f = d.Union(e );

        }
    }
}
