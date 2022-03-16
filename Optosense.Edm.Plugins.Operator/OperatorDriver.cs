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
            if (req is not OperatorRequest)
            {
                throw new EdmException($"{GetType().Name} driver parameters must be of type {typeof(OperatorRequest).Name}");
            }

            var request = (OperatorRequest) req;
            var command = request.Command;
            Step? parameters = default;
            if (!string.IsNullOrEmpty(request.Parameters)) {
                parameters = JsonConvert.DeserializeObject<Step>(request.Parameters);
                await StepTrigger(parameters.Condition);
            }

            var response = new DriverResponse
            {
                Parameters = request.Parameters,
                Planned = request.Offset,
                Request = request.Command,
                State = DriverResponseState.NotCompleted
            };

            return response;
        }

        private Task StepTrigger(string? condition)
        {
            Console.WriteLine(condition);
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

    public class OperatorDriverOptions : DriverOptions
    {
        public int Input { get; set; }
        public int Response { get; set; }
        public string InputRequest { get; set; }
        public string ActionRequest { get; set; }
    }
}
