using Microprojects.Edm;
using Microprojects.Edm.Drivers;
using Microprojects.Edm.Jobs;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using Optosense.Edm.Core.Contracts;
using Optosense.Edm.Drivers.Operator;
using Optosense.Edm.Profiles.Operator;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Drivers.OpcUa.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OperatorController : ControllerBase
    {
        private IJobContainer _jobs;
        private IOperationService _operationService;

        public OperatorController(IJobContainer jobs, IOperationService operationService)
        {
            _jobs = jobs;
            _operationService = operationService;
        }

        [HttpGet("steps")]
        public async Task<IEnumerable<object>> GetNodes([FromQuery]string token)
        {
            var result = _jobs.GetRunningTasks();
            return await Task.FromResult(result);
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

        [HttpGet("{operationId:int}/profile")]
        public async Task<IEnumerable<Step>> GetProfile(int operationId)
        {
            var devices = await _operationService.GetOperationDevices(operationId);
            var operatorDevice = devices?.FirstOrDefault(d => d.HostDevice.Device.DriverGuid == OperatorDriverPlugin.GetGuid())
                ?? throw new EdmException("Operator device cannot be found");
            var profile = JsonConvert.DeserializeObject<OperatorProfile>(operatorDevice.Profile?.TextJson ?? "[]");

            return profile.OrderBy(p => p.Order);
        }

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
