using System;
using System.Collections.Generic;
using System.Dynamic;
using System.IO.Ports;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using Microprojects.Edm;
using Microprojects.Edm.Drivers;
using Newtonsoft.Json;
using Optosense.Edm.Profiles.Operator;

namespace Optosense.Edm.Drivers.Operator
{
    [Driver(OptionsType = typeof(OperatorDriverOptions))]
    public class OperatorDriver : DriverBase
    {
        protected OperatorDriverOptions BoardOptions => (OperatorDriverOptions) Options;

        public OperatorDriver() { }

        public OperatorDriver(OperatorDriverOptions p)
        {
            Options = p;
        }

        public override string Init()
        {
            return OK;
        }

        public override async Task<DriverResponse> Execute(DriverRequest req)
        {
            var command = req.Command;
            Step? parameters = default;
            if (!string.IsNullOrEmpty(req.Parameters)) {
                parameters = JsonConvert.DeserializeObject<Step>(req.Parameters);
                await StepTrigger(parameters.Condition);
            }

            var response = new DriverResponse
            {
                Parameters = req.Parameters,
                Planned = req.Offset,
                Request = req.Command,
                State = DriverResponseState.NotCompleted
            };

            return response;
        }

        private Task StepTrigger(string? condition)
        {
            return Task.CompletedTask;
        }

        private string SubstituteParameters(string command, ExpandoObject parameters)
        {
            var result = command;
            foreach (var p in parameters)
            {
                result = result.Replace($"{{{p.Key}}}", p.Value.ToString());
            }

            return result;
        }
    }

    public class OperatorDriverOptions : IDriverOptions
    {
        public int Input { get; set; }
        public int Response { get; set; }
        public string InputRequest { get; set; }
        public string ActionRequest { get; set; }
    }
}
