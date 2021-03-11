using System;
using System.Collections.Generic;
using System.Dynamic;
using System.IO.Ports;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using Microprojects.Edm.Drivers;
using Newtonsoft.Json;
using Optosense.Edm.Utils;

namespace Optosense.Edm.Drivers.Mux
{
    [Driver(OptionsType = typeof(BoardDriverOptions))]
    public class BoardDriverBase : DriverBase, IDisposable
    {
        protected BoardDriverOptions BoardOptions => (BoardDriverOptions) Options;
        protected SerialPort Port { get; set; }

        public BoardDriverBase() { }

        public BoardDriverBase(BoardDriverOptions p)
        {
            Options = p;
        }

        public override string Init()
        {
            Port = new SerialPort(BoardOptions.Port, BoardOptions.Baudrate);
            Port.Open();
            return OK;
        }

        public override DriverResponse Execute(DriverRequest req)
        {
            if (req is not BoardDriverRequest)
            {
                throw new EdmException($"{GetType().Name} driver parameters must be of type {typeof(BoardDriverRequest).Name}");
            }

            var request = (BoardDriverRequest) req;
            var command = request.Command;
            var parameters = new ExpandoObject();
            if (!string.IsNullOrEmpty(request.Parameters)) {
                parameters = JsonConvert.DeserializeObject<ExpandoObject>(request.Parameters);
            }

            command = SubstituteParameters(command, parameters);
            var response = new DriverResponse { Planned = request.Offset, Executed = request.Offset, Request = command };
            try
            {
                response.Response = new string(
                    Port.Request(
                        command,
                        responseLength: 0, 
                        singleLine: true, 
                        timeout: request.Instruction?.Timeout ?? 500,
                        retries: request.Instruction.Retries ?? 0));
                response.State =
                    string.IsNullOrEmpty(request.Instruction.Syntax) ||
                    Regex.IsMatch(
                        response.Response,
                        SubstituteParameters(request.Instruction.Syntax, parameters),
                        RegexOptions.Singleline) ? 
                            DriverResponseState.Ok : DriverResponseState.InvalidResponse;
                var match = Regex.Match(response.Response, request.Instruction.Syntax, RegexOptions.Singleline);
                var outParams = new ExpandoObject();
                parameters.All(p => outParams.TryAdd(p.Key, p.Value));
                if (match.Success)
                {
                    // Skip first global match
                    match.Groups.Keys.Skip(1).All(g => outParams.TryAdd(g, match.Groups[g].Value));
                }
                response.Parameters = JsonConvert.SerializeObject(outParams);
            }
            catch (Exception e)
            {
                response.Message = e switch {
                    AggregateException ag when ag.InnerException is not TimeoutException => e.InnerException.Message,
                    not AggregateException or TimeoutException => e.Message,
                    _ => null
                };
                response.State = e switch {
                    AggregateException ag when ag.InnerException is TimeoutException => DriverResponseState.Timeout,
                    TimeoutException => DriverResponseState.Timeout,
                    _ => DriverResponseState.Failed
                };
            }

            return response;
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

        public void Dispose()
        {
            if (Port != null && Port.IsOpen) Port.Close();
            Port.Dispose();
        }
    }

    public class BoardDriverOptions : DriverOptions
    {
        public string Port { get; set; }
        public int Baudrate { get; set; } = 9600;
        public int DataBits { get; set; } = 8;
        public int Timeout { get; set; } = 1200;
        public int Capacity { get; set; }
    }
}
