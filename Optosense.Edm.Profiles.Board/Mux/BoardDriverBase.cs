using System;
using System.Collections.Generic;
using System.IO.Ports;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using Microprojects.Edm.Drivers;
using Microprojects.Edm.Utils;
using Newtonsoft.Json;
using Optosense.Edm.Profiles.Board;
using Optosense.Edm.Utils;

namespace Optosense.Edm.Drivers.Mux
{
    [Driver(OptionsType = typeof(BoardDriverOptions))]
    public partial class BoardDriverBase : DriverBase, IReactiveDriver, IDisposable
    {
        protected BoardDriverOptions BoardOptions => (BoardDriverOptions)Options;
        protected SerialPort Port { get; set; }
        protected CancellationTokenSource CancellationTokenSource { get; } = new CancellationTokenSource();
        protected CancellationToken CancellationToken => CancellationTokenSource.Token;
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
            // TODO Make safe port closing regarding if it is in busy state
            //CancellationToken.Register(() => Port.Close());
            
            return OK;
        }

        public override async Task<DriverResponse> Execute(DriverRequest req)
        {
            var response = new DriverResponse 
            { 
                Planned = req.Offset, 
                Executed = req.Offset, 
                Request = req.Command, 
                State = DriverResponseState.Ok 
            };
            if (CancellationToken.IsCancellationRequested)
            {
                return response with {State = DriverResponseState.NotCompleted, Message = "Operation cancelled"};
            }
            
            if (req is not BoardDriverRequest request)
            {
                if (req.Command != "Stop")
                {
                    throw new EdmException(
                        $"{GetType().Name} driver parameters must be of type {nameof(BoardDriverRequest)}");
                }

                await CancellationTokenSource.CancelAsync();
                Dispose();
                response.Response = DriverResponseState.Ok.ToString();
                response.Parameters = "{Stop: true}";
                return response;
            }

            if (request.Instruction is null)
            {
                throw new EdmException("Instruction for board driver must not be null");
            }
            
            var instruction = CodeParamsRegex().Replace(request.Instruction.Code ?? request.Command, "").Trim();
            var command = request.Command;
            var parameters = string.IsNullOrEmpty(request.Parameters) ? new() :
                JsonConvert.DeserializeObject<Dictionary<string, object>>(request.Parameters);
            command = SubstituteParameters(command, parameters);
            response.Request = command;
            try
            {
                var bytes = await Port.Request(
                        command,
                        responseLength: request.Instruction.Length ?? 0,
                        singleLine: true,
                        timeout: request.Instruction.Timeout ?? 100,
                        retries: request.Instruction.Retries ?? 0);

                if (instruction == "KZ?")
                {
                    try
                    {
                        await ExecuteKz(bytes, request.Instruction.Syntax, response);
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
                var match = Regex.Match(response.Response, request.Instruction.Syntax ?? string.Empty, RegexOptions.Singleline);
                if (match.Success)
                {
                    // Skip first global match
                    foreach (var key in match.Groups.Keys.Skip(1))
                    {
                        parameters[key] = match.Groups[key].Value;
                    }
                }
                else
                {
                    // Set empty output parameters if response is wrong
                    foreach (var p in GetParameters(request.Instruction))
                    {
                        parameters.TryAdd(p, null);
                    }
                }

            }
            catch (Exception e)
            {
                // Add default null parameters to stress that error happened
                foreach (var p in GetParameters(request.Instruction))
                {
                    parameters.TryAdd(p, null);
                }

                response.Message = e.GetMeaningfulMessage();
                response.State = e switch
                {
                    AggregateException { InnerException: TimeoutException } => DriverResponseState.Timeout,
                    TimeoutException => DriverResponseState.Timeout,
                    OperationCanceledException => DriverResponseState.NotCompleted,
                    _ => DriverResponseState.Failed
                };
            }

            // Provide parameters no matter what
            response.Parameters = JsonConvert.SerializeObject(parameters);
            
            if (CancellationToken.IsCancellationRequested)
                Dispose();
            
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
            if (Port is { IsOpen: true }) 
                Port.Close();
        }

        private IEnumerable<string> GetParameters(Instruction instr)
        {
            var matches = ParametersRegex().Matches(instr.Syntax ?? string.Empty);
            return matches.Select(m => m.Groups[1].Value);
        }

        private async Task ExecuteKz(byte[] bytes, string syntax, DriverResponse response)
        {
            int? num = bytes != null ? 
                BitConverter.ToInt32(bytes.Take(4).Reverse().ToArray(), 0) :
                null;
            var outParam = ParametersRegex().Matches(syntax ?? string.Empty)
                .FirstOrDefault()
                ?.Groups[1].Value ?? throw new EdmException("Output param for instruction \"KZ\" is missing");
            for (var i = 0; i < BoardOptions.Capacity; i++)
            {
                var value = num >> i & 1;
                await PushResponse(response with
                {
                    Parameters = JsonConvert.SerializeObject(new Dictionary<string, object>
                    {
                        { "ADDR", $"#{i:X2}" },
                        { outParam, value }
                    }),
                    Response = value.ToString()
                }, false);
            }
        }

        [GeneratedRegex("{.*?}")]
        private static partial Regex CodeParamsRegex();
        [GeneratedRegex(@"\?<(\w+?)>")]
        private static partial Regex ParametersRegex();
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
