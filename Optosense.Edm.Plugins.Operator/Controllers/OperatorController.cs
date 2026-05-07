using Microprojects.Edm;
using Microprojects.Edm.Drivers;
using Microprojects.Edm.Jobs;
using Microsoft.AspNetCore.Mvc;
using Optosense.Edm.Drivers.Operator;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Optosense.Edm.Drivers.OpcUa.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OperatorController : ControllerBase
    {
        private IJobContainer _jobs;

        public OperatorController(IJobContainer jobs)
        {
            _jobs = jobs;
        }

        [HttpGet("{operationId:int}/state")]
        public OperatorState? GetOperatorState(int operationId)
        {
            var driver = GetDriver(operationId);
            return (OperatorState?)driver?.GetState();
        }

        [HttpPost("{operationId:int}/response")]
        public async Task<bool> HandleResponse(int operationId, Dictionary<string, object> parameters)
        {
            var driver = GetDriver(operationId);
            await driver.HandleResponse(parameters);
            return true;
        }

        // GetProfile previously fetched the operator-step JSON via IOperationService
        // (Technologies.Contracts) and deserialized it into an OperatorProfile. After
        // the Technologies refactor, Operator must obtain that data through the plugin
        // data-exchange pattern (SignalR/Intercom-driven) instead of a direct service
        // call across plugin boundaries. Endpoint commented out until the new path lands.
        // [HttpGet("{operationId:int}/profile")]
        // public async Task<IEnumerable<Step>> GetProfile(int operationId) { ... }

        private IContainDriver? GetDeviceJob(int operationId)
        {
            var job = (IContainDriver?)_jobs.GetRunningJobs()
                .FirstOrDefault(j =>
                    j is IContainDriver jd &&
                    jd.GetDriverGuid() == OperatorDriverPlugin.GetGuid() &&
                    jd.GetOperationId() == operationId);
            //?? throw new EdmException("Operator driver not found");
            return job;
        }

        private OperatorDriver? GetDriver(int operationId) => (OperatorDriver?)GetDeviceJob(operationId)?.GetDriver();
    }
}
