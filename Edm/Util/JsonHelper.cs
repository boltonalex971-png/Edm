using Microprojects.Edm;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.Serialization.Json;
using System.Text;
using System.Threading.Tasks;

namespace Testcalibur.Utils
{
    public static class JsonHelper
    {

        public static Params ToParams(string parameters)
        {
            MemoryStream ms = new MemoryStream(Encoding.UTF8.GetBytes($"{{{parameters.Replace("\\", "\\\\")}}}"));
            DataContractJsonSerializer ser = new DataContractJsonSerializer(typeof(Params));
            var result = ser.ReadObject(ms) as Params;
            ms.Close();
            return result;
        }
    }
}
