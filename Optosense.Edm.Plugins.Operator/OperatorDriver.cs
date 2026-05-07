using Microprojects.Edm.Drivers;
using Microprojects.Edm.Intercom;
using Newtonsoft.Json;
using Optosense.Edm.Jobs;
using Optosense.Edm.Profiles.Operator;

namespace Optosense.Edm.Drivers.Operator
{
    [Driver(OptionsType = typeof(OperatorDriverOptions))]
    public class OperatorDriver : DriverBase, IDriverWithState, IReactiveDriver, INeedIntercom
    {
        protected OperatorDriverOptions BoardOptions => (OperatorDriverOptions) Options;
        protected StartDeviceJobParameters JobParameters => (StartDeviceJobParameters) Parameters; 

        public Func<DriverResponse, bool, Task>? PushResponse { get; set; }
        public IIntercom Intercom { get; set; }

        private OperatorState? _state;
        private DateTime _startTs = DateTime.UtcNow;
        private CancellationTokenSource _tokenSource;
        private DriverResponse _response;

        public OperatorDriver() { }

        public OperatorDriver(DeviceParameters parameters) : base(parameters)
        {
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
            if (req is { Parameters: null }) 
                return null;
            
            var state = JsonConvert.DeserializeObject<OperatorState>(req.Parameters);
            SetState(state);
            // Inlined formerly OptosenseIntercomExtensions.PublishOperatorAsync — that
            // extension lived alongside Technologies-specific intercom types; inlining
            // here keeps Operator from project-referencing Technologies for one channel string.
            await Intercom.Publish($"{IntercomExtensions.IntercomOperationChannel(JobParameters.Operation)}-operator", state);
            // Wait for response
            _tokenSource = new CancellationTokenSource();
            await Task.Delay(-1, _tokenSource.Token).ContinueWith((t) => { });
            ClearState();
            return _response;

        }

        private void ClearState()
        {
            _state = null;
        }

        private void SetState(OperatorState state) 
        {
            _state = state;
            _state?.Scheduled = DateTime.UtcNow;
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
                extendedParameters["ResponseTime"] = (DateTime.UtcNow - _state.Scheduled).TotalSeconds;
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
