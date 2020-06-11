using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microprojects.Edm;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Optosense.Edm.WebUi.Controllers
{
    [ApiController]
    [Route("api/[controller]/[action]")]
    public class OperationsController : ControllerBase
    {
        [HttpPost]
        public async Task<JsonResult> Start(Guid operationId)
        {
            return await Task.FromResult(new JsonResult(new { Message = $"Operation {operationId} successfully started" }));
        }

        [HttpPost]
        public async Task<JsonResult> Cancel(Guid operationId)
        {
            return await Task.FromResult(new JsonResult(new { Message = $"Operation {operationId} successfully canceled" }));
        }

        [HttpPost]
        public async Task<JsonResult> Status(Guid operationId)
        {
            return await Task.FromResult(new JsonResult(new
            {
                Status = "InProgress",
                Progress = 28,
                Estimated = TimeSpan.FromMinutes(72),
                Elapsed = TimeSpan.FromMinutes(28),
                Message = $"Operation {operationId} is in progress"
            })) ;
        }

        [HttpPost]
        public async Task<JsonResult> Result(Guid operationId)
        {
            return await Task.FromResult(new JsonResult(new[]
            {
                new { Id = Guid.NewGuid(), Status = "Ok" },
                new { Id = Guid.NewGuid(), Status = "Ok" },
                new { Id = Guid.NewGuid(), Status = "Broken" },
                new { Id = Guid.NewGuid(), Status = "Failed" },
                new { Id = Guid.NewGuid(), Status = "Failed" },
                new { Id = Guid.NewGuid(), Status = "Ok" }
            }));
        }
    }
}