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
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;

namespace Optosense.Edm.Test
{
    [TestClass]
    public class DriverTest
    {
        [TestMethod]
        public void ExecutionPlanTest()
        {
            var r = new Regex(@"{(\w*)}");
            var m = r.Matches("{ADDR}F {qqq}");
            var mux = new MuxDriverPlugin();
            var parameters = new { ADDR = new int[] { 0, 1, 2, 3, 4, 5 }, SEC = 0, ADMIN = 1234 };
            //var profile = new BoardProfile
            //{
            //    new Command { Instructions = { new CommandInstruction { Instruction = new Instruction { Code = "{ADDR}F", Timeout = 100 } } } }
            //};
            var profileJson =  //JsonConvert.SerializeObject(profile);
                @"[
                    {name: ""Measure"", instructions: [
                        {order: 20, name: ""TABTINIT"", instruction: {name: ""TABTINIT"", code: ""{ADDR}TABTINIT"", syntax: ""100000.0"", timeout: 200 } },
                        {order: 20, name: ""ZERO1"", instruction: {name: ""ZERO1"", code: ""{ADDR}ZERO1"", syntax: ""ZERO1 OK"", timeout: 200 }  },
                        {order: 10, name: ""F"", instruction: {name: ""F"", code: ""{ADDR}F"", syntax: """", timeout: 100 } } ,
                        {order: 10, name: ""PW?"", instruction: {name: ""PW?"", code: ""{ADDR}PW?"", syntax: ""00000"", timeout: 60000 }  }
                    ]}
                ]
                ";

            var paramJson = JsonConvert.SerializeObject(parameters);
            var plan = mux.GetPlan(profileJson, paramJson).ToList();


            Assert.IsTrue(true);
        }

        [TestMethod]
        public async Task OpcUaDriverTest()
        {
            var options = new OpcUaDriverOptions { Endpoint = "opc.tcp://localhost:51210/UA/SampleServer" };
            var driver = new OpcUaDriver(options);
            driver.Init();
            //var node = await driver.GetNode("ns=4;i=1241");
            var nodes = driver.GetChildNodes("ns=4;i=1240"); 
//            Console.WriteLine(node.DisplayName);
            //driver.Start();
            //await Task.Delay(3000);
            driver.Stop();

//            Assert.AreEqual(node.DisplayName, "Boiler #1");
        }

        [TestMethod]
        public void ParseExpressionTest()
        {
            var expOffset = "100";
            var expBool = "Param";
            var exprCondition = "Temp>10";
            var state = new Dictionary<string, object>
            {
                {"Param", true },
                {"Temp", 5 }
            };

            var exp1 = AdaptiveExpressions.Expression.Parse(expOffset);
            var exp2 = AdaptiveExpressions.Expression.Parse(expBool);
            var exp3 = AdaptiveExpressions.Expression.Parse(exprCondition);

            var (value1, error1) = exp1.TryEvaluate(state);
            var (value2, error2) = exp2.TryEvaluate<bool>(state);
            var (value3, error3) = exp3.TryEvaluate<bool>(state);
            Assert.AreEqual(value1, 100);
            Assert.IsTrue(value2);
            Assert.AreEqual(value3, false);
        }
    }
}
