using System;
using System.Collections.Generic;
using System.Dynamic;
using System.IO.Ports;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microprojects.Edm.Drivers;
using Newtonsoft.Json;
using Optosense.Edm.Utils;

namespace Optosense.Edm.Drivers.Mux
{
    [Driver(OptionsType = typeof(BoardDriverOptions))]
    public class BoardDriverBase : DriverBase, IParamProvider, IDisposable
    {
        protected BoardDriverOptions BoardOptions => (BoardDriverOptions) Options;
        protected SerialPort Port { get; set; }
        protected HttpClient HttpClient { get; } = new();

        public BoardDriverBase() { }

        public BoardDriverBase(BoardDriverOptions p)
        {
            Options = p;
        }

        public override string Init()
        {
            Port = new SerialPort(BoardOptions.Port, BoardOptions.Baudrate);
            Port.Open();
            HttpClient.BaseAddress = new Uri("http://localhost:5000");
            HttpClient.DefaultRequestHeaders.Accept.Clear();
            HttpClient.DefaultRequestHeaders.Accept.Add(
                new MediaTypeWithQualityHeaderValue("application/json"));
            return OK;
        }

        public override Task<DriverResponse> Execute(DriverRequest req)
        {
            var response = new DriverResponse { Planned = req.Offset, Executed = req.Offset, Request = req.Command, State = DriverResponseState.Ok };
            if (req is not BoardDriverRequest)
            {
                if (req.Command == "Stop")
                {
                    Dispose();
                    response.Response = DriverResponseState.Ok.ToString();
                    return Task.FromResult(response);
                }
                else
                {
                    throw new EdmException($"{GetType().Name} driver parameters must be of type {typeof(BoardDriverRequest).Name}");
                }
            }

            var request = (BoardDriverRequest) req;
            var command = request.Command;
            var parameters = new ExpandoObject();
            if (!string.IsNullOrEmpty(request.Parameters)) {
                parameters = JsonConvert.DeserializeObject<ExpandoObject>(request.Parameters);
            }

            command = SubstituteParameters(command, parameters);
            response.Request = command;
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

            return Task.FromResult(response);
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

        public async Task<DriverResponse> GetParam(string parameterName)
        {
            var result = new DriverResponse
            {
                Request = parameterName,
                State = DriverResponseState.Ok
            };
            if (parameterName == "Serial")
            {
                // TODO Move to REST API Client driver
                try
                {
                    var response = await HttpClient.PostAsJsonAsync("serials", "TST");
                    response.EnsureSuccessStatusCode();
                    result.Response = await response.Content.ReadAsStringAsync();
                    result.Parameters = $"{{\"{parameterName}\": {result.Response}}}";
                }
                catch (Exception ex) 
                { 
                    result.Message = ex.Message;
                    result.State = DriverResponseState.Failed;
                }
            }

            return result;
        }

        public void Dispose()
        {
            if (Port != null && Port.IsOpen) Port.Close();
            Port.Dispose();
            HttpClient.Dispose();
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
