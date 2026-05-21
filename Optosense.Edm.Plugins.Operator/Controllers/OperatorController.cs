using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microprojects.Edm.Drivers;
using Microprojects.Edm.Jobs;
using Microsoft.AspNetCore.Mvc;
using Optosense.Edm.Drivers.Operator;

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

        [HttpGet("{operationId:guid}/state")]
        public OperatorState? GetOperatorState(Guid operationId)
        {
            var driver = GetDriver(operationId);
            return (OperatorState?)driver?.GetState();
        }

        [HttpPost("{operationId:guid}/response")]
        public async Task<bool> HandleResponse(Guid operationId, Dictionary<string, object> parameters)
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

        private IContainDriver GetDeviceJob(Guid operationId)
        {
            var job = (IContainDriver)_jobs.GetRunningJobs()
                .FirstOrDefault(j =>
                    j is IContainDriver jd &&
                    jd.GetDriverGuid() == OperatorDriverPlugin.GetGuid() &&
                    jd.GetOperationId() == operationId);
            return job;
        }

        private OperatorDriver GetDriver(Guid operationId) => (OperatorDriver)GetDeviceJob(operationId)?.GetDriver();
    }
}
