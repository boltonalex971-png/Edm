using System;
using System.Collections.Generic;
using System.Dynamic;
using System.IO.Ports;
using System.Linq;
using System.Numerics;
using System.Text;
using System.Text.RegularExpressions;
using Microprojects.Edm;
using Microprojects.Edm.Drivers;
using Newtonsoft.Json;
using Optosense.Edm.Profiles.Operator;

namespace Optosense.Edm.Drivers.Operator
{
    [Driver(OptionsType = typeof(OperatorDriverOptions))]
    public class OperatorDriver : DriverBase, IDriverWithState, IReactiveDriver
    {
        protected OperatorDriverOptions BoardOptions => (OperatorDriverOptions) Options;

        public Func<DriverResponse, bool, Task>? PushResponse { get; set; }

        private OperatorState? _state;
        private DateTime _startTs = DateTime.UtcNow;
        private CancellationTokenSource _tokenSource;
        private DriverResponse _response;

        public OperatorDriver() { }

        public OperatorDriver(OperatorDriverOptions p)
        {
            Options = p;
        }

        public override string Init()
        {
            // TODO has to get SignalR channel and create a operator group for the operation
            return OK;
        }

        public override async Task<DriverResponse> Execute(DriverRequest req)
        {
            if (req.Command == Stop() && _response?.Request == Stop())
            {
                // This means that the previous command was "Stop" and 
                // StartDevice job is just cancelling the driver 
                return null;
            }
            
            // TODO Send the request by SignalR channel
            if (req is { Parameters: not null })
            {
                SetState(JsonConvert.DeserializeObject<OperatorState>(req.Parameters));
                // Wait for response
                _tokenSource = new();
                await Task.Delay(-1, _tokenSource.Token).ContinueWith((t) => { });
                ClearState();
                return _response;
            }

            return null;
        }

        private void ClearState()
        {
            _state = null;
        }

        private void SetState(OperatorState state) 
        {
            _state = state;
            if (_state != null)
            {
                _state.Scheduled = DateTime.UtcNow;
            }
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

        public IDriverState GetState()
        {
            return _state;
        }

        public Task HandleResponse(Dictionary<string, object> parameters)
        {
            var response = new DriverResponse
            {
                Executed = (long)(DateTime.UtcNow - _startTs).TotalMilliseconds,
                State = DriverResponseState.Ok
            };

            if (_state == null)
            {
                response.Message = "Driver is not expecting any operator action";
                response.State = DriverResponseState.InvalidResponse;
            }
            else
            {
                response.Planned = (long)(_state.Scheduled - _startTs).TotalMilliseconds;
                response.Request = _state.Command;
                response.Response = nameof(DriverResponseState.Ok);
                var extendedParameters = parameters ?? new Dictionary<string, object>();
                extendedParameters[_state.Command] = true;
                response.Parameters = JsonConvert.SerializeObject(extendedParameters);
                if (response.Executed - response.Planned > _state.ResponseTime * 1000)
                {
                    response.State = DriverResponseState.Timeout;
                }
            }

            _response = response;
            _tokenSource.Cancel();

            return Task.CompletedTask;
        }
    }

    public class OperatorState : Step, IDriverState 
    { 
        public DateTime Scheduled { get; set; }
    }

    public class OperatorDriverOptions : IDriverOptions
    {
        public int Input { get; set; }
        public int Response { get; set; }
        public string InputRequest { get; set; }
        public string ActionRequest { get; set; }
    }
}
