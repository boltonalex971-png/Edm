using Microsoft.AspNetCore.Mvc;
using Opc.Ua;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Drivers.OpcUa.Controllers
{
    [ApiController]
    [Route("api/technologies/[controller]")]
    public class OpcUaController : ControllerBase
    {
        [HttpGet("endpoints")]
        public async Task<IEnumerable<string>> GetEndpointsMessage(string url)
        {
            return await Task.FromResult(new List<string> { "qqq" });
        }

        [HttpGet("nodes")]
        public async Task<IEnumerable<object>> GetNodes([FromQuery]string id, [FromQuery]string endpoint)
        {
            var options = new OpcUaDriverOptions { Endpoint = endpoint };
            var driver = new OpcUaDriver(options);
            driver.Init();
            var nodes = driver.GetChildNodes(id);
            driver.Stop();
            return await Task.FromResult(nodes);
        }

        [HttpGet("node")]
        public async Task<object> GetNode([FromQuery]string id, [FromQuery] string endpoint)
        {
            var options = new OpcUaDriverOptions { Endpoint = endpoint };
            var driver = new OpcUaDriver(options);
            driver.Init();
            var node = await driver.GetNode(id);
            driver.Stop();
            return node;
        }
    }
}
