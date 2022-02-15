using Microprojects.Edm;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Newtonsoft.Json;
using Optosense.Edm.Domain.Models;
using Optosense.Edm.Drivers.Mux;
using Optosense.Edm.Profiles.Board;
using System;
using System.Diagnostics;
using System.Linq;
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
    }
}
