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
using Microprojects.Edm.Drivers;
using Microsoft.Extensions.Logging.Abstractions;
using Optosense.Edm.Utils;

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
            var profileJson = //JsonConvert.SerializeObject(profile);
                @"[
                    {name: ""KZ"", instructions: [
                        {order: 10, name: ""KZ?"", instruction: {name: ""KZ?"", code: ""KZ?"", syntax: ""(?<KZ>)"", timeout: 1000 }  }
                    ]},
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
        public async Task RealExecutionPlanTest()
        {
            var mux = new MuxDriverPlugin();
            var logger = NullLogger.Instance;
            var parameters = new { ADDR = new[] { 0, 1, 2, 3, 4, 5 }, Capacity = 5 };
            var profileJson = //JsonConvert.SerializeObject(profile);
                """
                [
                    {"name": "Measure", "instructions": [
                        {"order": 10, "offset": 1000, "instruction": {"name": "SREV", "code": "{ADDR}SREV?", "syntax": "", "timeout": 200 } },
                        {"order": 15, "offset": 1000, "instruction": {"name": "F", "code": "{ADDR}F", "syntax": "", "timeout": 100 } } ,
                    ]}
                ]
                """;

            var paramJson = JsonConvert.SerializeObject(parameters);
            var plan = mux.GetPlan(profileJson, paramJson).ToList();
            var driver = new BoardDriverBase(new BoardDriverOptions { Baudrate = 9600, Port = "COM4", Capacity = 20 });
            driver.Init();
            await plan.Launch(
                driver,
                Delay,
                ShowRequestAsync,
                logger,
                CancellationToken.None
            );
            driver.Dispose();

            Assert.IsTrue(true);
            return;

            async Task<bool> Delay(DriverRequest req)
            {
                await Task.Delay((int)req.Offset);
                return true;
            }

            async Task ExecuteRequestAsync(IDeviceDriver d, DriverRequest r)
            {
                Debug.WriteLine($"REQUEST {DateTime.Now:HH:mm:ss.fff}: {JsonConvert.SerializeObject(r.Parameters)}");
                var response = await driver.Execute(r);
                Debug.WriteLine(
                    $"RESPONSE {DateTime.Now:HH:mm:ss.fff}: {JsonConvert.SerializeObject(response.Response)}");
                //await Task.Delay(1000);
            }

            Task ShowRequestAsync(IDeviceDriver d, DriverRequest r)
            {
                Debug.WriteLine($"REQUEST {DateTime.Now:HH:mm:ss.fff}: {JsonConvert.SerializeObject(r.Parameters)}");
                return Task.CompletedTask;
            }

            void ExecuteRequest(IDeviceDriver d, DriverRequest r)
            {
                Debug.WriteLine($"REQUEST {DateTime.Now:HH:mm:ss.fff}: {JsonConvert.SerializeObject(r.Parameters)}");
            }
        }

        [TestMethod]
        public async Task AsyncExecutionPlanTest()
        {
            var mux = new MuxDriverPlugin();
            var logger = NullLogger.Instance;
            var parameters = new { ADDR = new[] { 0, 1, 2, 3, 4, 5 }, Capacity = 5 };
            var profileJson = //JsonConvert.SerializeObject(profile);
                """
                [
                    {"name": "Measure", "instructions": [
                        {"order": 10, "offset": 500, "instruction": {"name": "SREV", "code": "{ADDR}SREV?", "syntax": "", "timeout": 200 } },
                        {"order": 15, "offset": 1000, "instruction": {"name": "F", "code": "{ADDR}F", "syntax": "", "timeout": 100 } } ,
                    ]}
                ]
                """;

            var paramJson = JsonConvert.SerializeObject(parameters);
            var plan = mux.GetAsyncPlan(profileJson, paramJson, DateTime.Now);
            // var driver = new BoardDriverBase(new BoardDriverOptions { Baudrate = 9600, Port = "COM4", Capacity = 20 });
            // driver.Init();
            var start =  DateTime.UtcNow;
            await foreach (var no in plan) //IterateAsync())
            {
                Debug.Write(
                    $"SCHEDULED {start.AddMilliseconds(no.Offset):HH:mm:ss.fff}\tCALLED {DateTime.UtcNow:HH:mm:ss.fff}\t");
                var payload = Random.Shared.Next(50, 200);
                await Task.Delay(payload);
                Debug.WriteLine($"PAYLOAD COMPLETE {DateTime.Now:HH:mm:ss.fff}\tpayload: {payload}\t\t{no.Command}");
            }

            return;

            async IAsyncEnumerable<int> IterateAsync()
            {
                var offset = 500;
                var scheduled = DateTime.UtcNow;
                Debug.WriteLine($"START AT {scheduled:HH:mm:ss.fff} ");
                foreach (var no in Enumerable.Range(0, 100))
                {
                    scheduled = scheduled.AddMilliseconds(offset);
                    var current = DateTime.UtcNow;
                    var next = (scheduled - current).TotalMilliseconds;
                    var delay = next > 0 ? next : 0;
                    await Task.Delay((int)delay);
                    var start = DateTime.UtcNow;
                    Debug.Write(
                        $"{(DateTime.UtcNow - scheduled).Milliseconds}\tSCHEDULED {scheduled:HH:mm:ss.fff}\tEXEC {start:HH:mm:ss.fff}\t");
                    yield return no;
                }

                Debug.Write($"COMPLETED AT {DateTime.UtcNow:HH:mm:ss.fff} ");
            }
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
                { "Param", true },
                { "Temp", 5 }
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