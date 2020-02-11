using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microprojects.Edm;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace WebApi.Controllers
{
    [ApiController]
    [Consumes("application/json")]
    [Route("[controller]")]
    public class CommandController : ControllerBase
    {
        [HttpPost]
        public async Task<ResponseData> Post(CommandData parameters)
        {
            var result = await CommandManager.GetInstance().Execute(parameters);
            return result;
        }
    }
}
