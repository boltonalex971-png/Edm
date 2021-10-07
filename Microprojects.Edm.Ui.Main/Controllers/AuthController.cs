using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Optosense.Edm.Core.Auditing;
using Optosense.Edm.Core.Contracts;
using Optosense.Edm.Core.Models;
using Optosense.Edm.Domain.Models;
using Microprojects.Edm.Ui.Main.Models;

namespace Microprojects.Edm.Ui.Main.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : AuthControllerBase
    {
        private readonly ILogger<AuthController> _logger;
        private readonly IMapper _mapper;

        public AuthController(ILogger<AuthController> logger, IMapper mapper)
        {
            _logger = logger;
            _mapper = mapper;
        }

        [HttpGet("user/name")]
        public Task<UserInfo> GetUserInfo()
        {
            return Task.FromResult(UserInfo);
        }
    }
}
