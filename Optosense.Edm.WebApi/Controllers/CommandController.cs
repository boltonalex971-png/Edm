using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microprojects.Edm;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace Optosense.WebApi.Controllers
{
    [ApiController]
    [Consumes("application/json")]
    [Route("[controller]")]
    public class CommandController : ControllerBase
    {
        private ICommandContainer CommandManager { get; }

        public CommandController(ICommandContainer container) 
        {
            CommandManager = container;
        }

        [HttpPost]
        public async Task<ResponseData> Post(CommandData parameters)
        {
            var result = await CommandManager.ExecuteAsync(parameters);
            return result;
        }
    }
}
