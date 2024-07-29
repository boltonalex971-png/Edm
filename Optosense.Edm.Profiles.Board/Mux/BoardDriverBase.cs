using System;
using System.Collections.Generic;
using System.IO.Ports;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microprojects.Edm.Drivers;
using Microprojects.Edm.Utils;
using Newtonsoft.Json;
using Optosense.Edm.Profiles.Board;
using Optosense.Edm.Utils;

namespace Optosense.Edm.Drivers.Mux
{
    [Driver(OptionsType = typeof(BoardDriverOptions))]
    public class BoardDriverBase : DriverBase, IReactiveDriver, IDisposable
    {
        protected BoardDriverOptions BoardOptions => (BoardDriverOptions)Options;
        protected SerialPort Port { get; set; }
        public Func<DriverResponse, bool, Task> PushResponse { get; set; }

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

        public override async Task<DriverResponse> Execute(DriverRequest req)
        {
            var response = new DriverResponse { Planned = req.Offset, Executed = req.Offset, Request = req.Command, State = DriverResponseState.Ok };
            if (req is not BoardDriverRequest)
            {
                if (req.Command == "Stop")
                {
                    Dispose();
                    response.Response = DriverResponseState.Ok.ToString();
                    response.Parameters = "{Stop: true}";
                    return response;
                }
                else
                {
                    throw new EdmException($"{GetType().Name} driver parameters must be of type {typeof(BoardDriverRequest).Name}");
                }
            }

            var request = (BoardDriverRequest)req;
            var instruction = Regex.Replace(request.Instruction?.Code ?? request.Command, "{.*?}", "").Trim();

            var command = request.Command;
            var parameters = string.IsNullOrEmpty(request.Parameters) ? new() :
                JsonConvert.DeserializeObject<Dictionary<string, object>>(request.Parameters);
            command = SubstituteParameters(command, parameters);
            response.Request = command;
            try
            {
                var bytes = Port.Request(
                        command,
                        responseLength: 0,
                        singleLine: true,
                        timeout: request.Instruction?.Timeout ?? 500,
                        retries: request.Instruction.Retries ?? 0);

                if (instruction == "KZ?")
                {
                    try
                    {
                        await executeKz(bytes, request.Instruction.Syntax, response);
                        response.Response = string.Join(string.Empty, bytes.Select(b => b.ToString("X2")));
                        return response;
                    }
                    catch (Exception e)
                    {
                        response.State = DriverResponseState.Failed;
                        response.Message = e.GetFullInfo();
                        return response;
                    }
                }

                response.Response = new string(bytes.Select(b => (char)b).ToArray());
                response.State =
                    string.IsNullOrEmpty(request.Instruction.Syntax) ||
                    Regex.IsMatch(
                        response.Response,
                        SubstituteParameters(request.Instruction.Syntax, parameters),
                        RegexOptions.Singleline) ?
                            DriverResponseState.Ok : DriverResponseState.InvalidResponse;
                var match = Regex.Match(response.Response, request.Instruction.Syntax, RegexOptions.Singleline);
                if (match.Success)
                {
                    // Skip first global match
                    foreach (var key in match.Groups.Keys.Skip(1))
                    {
                        parameters[key] = match.Groups[key].Value;
                    }
                }

            }
            catch (Exception e)
            {
                // Add default null parameters to stress that error happened
                GetParameters(request.Instruction).All(p => parameters.TryAdd(p, null));
                response.Message = e switch
                {
                    AggregateException ag when ag.InnerException is not TimeoutException => e.InnerException.Message,
                    not AggregateException or TimeoutException => e.Message,
                    _ => null
                };
                response.State = e switch
                {
                    AggregateException ag when ag.InnerException is TimeoutException => DriverResponseState.Timeout,
                    TimeoutException => DriverResponseState.Timeout,
                    _ => DriverResponseState.Failed
                };
            }

            // Provide parameters no matter what
            response.Parameters = JsonConvert.SerializeObject(parameters);

            return response;
        }

        private string SubstituteParameters(string command, Dictionary<string, object> parameters)
        {
            var result = command;
            foreach (var p in parameters)
            {
                result = result.Replace($"{{{p.Key}}}", p.Value?.ToString());
            }

            return result;
        }

        public void Dispose()
        {
            if (Port != null && Port.IsOpen) Port.Close();
            Port.Dispose();
        }

        private IEnumerable<string> GetParameters(Instruction instr)
        {
            var matches = Regex.Matches(instr.Syntax ?? string.Empty, @"\?<(\w+?)>");
            return matches.Select(m => m.Groups[1].Value);
        }

        private async Task executeKz(byte[] bytes, string syntax, DriverResponse response)
        {
            int? num = bytes != null ? 
                BitConverter.ToInt32(bytes.Take(4).Reverse().ToArray(), 0) :
                null;
            var outParam = Regex.Matches(syntax ?? string.Empty, @"\?<(\w+?)>")
                .FirstOrDefault()
                .Groups[1].Value;
            for (int i = 0; i < BoardOptions.Capacity; i++)
            {
                var value = num != null ? num >> i & 1 : null;
                await PushResponse(response with
                {
                    Parameters = JsonConvert.SerializeObject(new Dictionary<string, object>
                    {
                        { "ADDR", $"#{i.ToString("X2")}" },
                        { outParam, value }
                    }),
                    Response = value.ToString()
                }, false);
            }
        }
    }

    public class BoardDriverOptions : IDriverOptions
    {
        public string Port { get; set; }
        public int Baudrate { get; set; } = 9600;
        public int DataBits { get; set; } = 8;
        public int Timeout { get; set; } = 1200;
        public int Capacity { get; set; }
    }
}
