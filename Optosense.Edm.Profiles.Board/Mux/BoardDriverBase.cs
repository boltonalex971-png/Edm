using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.IO.Ports;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using Microprojects.Edm;
using Microprojects.Edm.Drivers;
using Microprojects.Edm.Utils;
using Newtonsoft.Json;
using Optosense.Edm.Profiles.Board;

namespace Optosense.Edm.Drivers.Mux
{
    [Driver(OptionsType = typeof(BoardDriverOptions))]
    public partial class BoardDriverBase : DriverBase, IReactiveDriver, IDisposable
    {
        protected BoardDriverOptions BoardOptions => (BoardDriverOptions)Options;
        protected SerialPort Port { get; set; }
        protected CancellationTokenSource CancellationTokenSource { get; } = new CancellationTokenSource();
        protected CancellationToken CancellationToken => CancellationTokenSource.Token;

        // Minimum interval between serial port sequential requests
        private const int PortRequestSpan = 100;

        // Keep timestamp of the last serial port request 
        private DateTime _lastPortRequestTs;

        // Timing serial port read operation
        private readonly Stopwatch _stopwatch = new();

        // Buffer to read serial port. Reading is sequential operation so it's safe to keep it instance-wise
        private readonly byte[] _buffer = new byte[4096];

        public Func<DriverResponse, bool, Task> PushResponse { get; set; }

        public BoardDriverBase()
        {
        }

        public BoardDriverBase(BoardDriverOptions p)
        {
            Options = p;
        }

        public override string Init()
        {
            Port = new SerialPort(BoardOptions.Port, BoardOptions.Baudrate);
            Port.Open();
            // TODO use driver parameters to get test command
            try
            {
                var command = "REV?";
                var response = Send($"{command}\r", null, 1000, true, 0, 0).Result;
            }
            catch (Exception)
            {
                throw new EdmException("Multiplexor is not responding");
            }
            
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
                return response with { State = DriverResponseState.NotCompleted, Message = "Operation cancelled" };
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
                response.Response = nameof(DriverResponseState.Ok);
                response.Parameters = "{Stop: true}";
                return response;
            }

            if (request.Instruction is null)
            {
                throw new EdmException("Instruction for board driver must not be null");
            }

            var instruction = CodeParamsRegex().Replace(request.Instruction.Code ?? request.Command, "").Trim();
            var command = request.Command;
            var parameters = string.IsNullOrEmpty(request.Parameters)
                ? new()
                : JsonConvert.DeserializeObject<Dictionary<string, object>>(request.Parameters);
            command = SubstituteParameters(command, parameters);
            response.Request = command;
            var bytes = Array.Empty<byte>();

            try
            {
                bytes = await Send(
                    $"{command}\r",
                    (b) => PushResponse(Respond(b), false),
                    request.Instruction.Timeout ?? 100,
                    !request.Instruction.MultiLineResponse,
                    request.Instruction.Length ?? 0,
                    request.Instruction.Retries ?? 0);

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

                // Provide parameters no matter what
                response.Parameters = JsonConvert.SerializeObject(parameters);

                return response;
            }


            if (CancellationToken.IsCancellationRequested) Dispose();

            return request.Instruction.MultiLineResponse ? null : Respond(bytes);

            DriverResponse Respond(byte[] bytes1)
            {
                response.Response = new string(bytes1.Select(b => (char)b).ToArray());
                response.State =
                    string.IsNullOrEmpty(request.Instruction.Syntax) ||
                    Regex.IsMatch(
                        response.Response,
                        SubstituteParameters(request.Instruction.Syntax, parameters),
                        RegexOptions.Singleline)
                        ? DriverResponseState.Ok
                        : DriverResponseState.InvalidResponse;
                var match = Regex.Match(response.Response, request.Instruction.Syntax ?? string.Empty,
                    RegexOptions.Singleline);
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

                response.Parameters = JsonConvert.SerializeObject(parameters);
                //Debug.WriteLine(JsonConvert.SerializeObject(response with { Parameters = JsonConvert.SerializeObject(parameters)}));
                //await PushResponse(response with { Parameters = JsonConvert.SerializeObject(parameters) }, false);
                return response;
            }
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
            int? num = bytes != null ? BitConverter.ToInt32(bytes.Take(4).Reverse().ToArray(), 0) : null;
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

        private async Task<byte[]> Send(string command, Func<byte[], Task> onLineReceived, int initialTimeout,
            bool singleLine,
            int responseLength,
            int retries)
        {
            long timeout = initialTimeout;
            for (;;)
            {
                // Check if span between requests is exceeded
                var check = (DateTime.UtcNow - _lastPortRequestTs).TotalMilliseconds;
                if (check < PortRequestSpan)
                {
                    await Task.Delay(PortRequestSpan - (int)check, CancellationToken);
                }

                // Continue executing request
                var totalRead = 0;
                Port.DiscardInBuffer();
                Port.DiscardOutBuffer();
                // TODO ReadTimeout has no effect in async reading mode
                // Port.BaseStream.ReadTimeout = timeout;
                // Port.ReadTimeout = timeout;
                Port.Write(command);
                try
                {
                    do
                    {
                        totalRead = 0;
                        timeout = initialTimeout;
                        do
                        {
                            // Whole response must arrive before timeout exceeded
                            if (timeout < 0)
                                throw new TimeoutException();
                            _stopwatch.Restart();
                            // var readCount = await Port.BaseStream.ReadAsync(_buffer, totalRead, _buffer.Length - totalRead,
                            //         CancellationToken)
                            //     .WaitAsync(TimeSpan.FromMilliseconds(timeout), CancellationToken);
                            var readCount = await Task.Run(
                                    () => Port.Read(_buffer, totalRead, _buffer.Length - totalRead),
                                    CancellationToken)
                                .WaitAsync(TimeSpan.FromMilliseconds(timeout), CancellationToken);
                            _stopwatch.Stop();
                            timeout -= _stopwatch.ElapsedMilliseconds;
                            totalRead += readCount;
                        } while (responseLength == 0 && _buffer[totalRead - 1] != '\r' ||
                                 responseLength != 0 && responseLength < totalRead);

                        if (!singleLine)
                        {
                            if (totalRead == 1 && _buffer[totalRead - 1] == '\r')
                            {
                                break;
                            }

                            await onLineReceived(_buffer[..totalRead]);
                            if (_buffer[totalRead - 2] == '\r' && _buffer[totalRead - 1] == '\r')
                            {
                                break;
                            }
                        }
                    } while (!singleLine);
                }
                catch (TimeoutException)
                {
                    if (totalRead == 0 || totalRead < responseLength)
                    {
                        if (retries-- <= 0)
                        {
                            throw;
                        }
                        else
                        {
                            // Increase timeout by 50%
                            timeout = (int)(initialTimeout * 1.5);
                            continue;
                        }
                    }
                }
                finally
                {
                    _stopwatch.Stop();
                    _lastPortRequestTs = DateTime.UtcNow;
                }

                return _buffer[..totalRead];
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