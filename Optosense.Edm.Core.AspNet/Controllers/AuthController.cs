using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Security.Claims;
using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Optosense.Edm.Core.Auditing;
using Optosense.Edm.Core.Contracts;
using Optosense.Edm.Core.Models;
using Optosense.Edm.Domain.Models;
using Microsoft.Extensions.Configuration;
using System.Security.Principal;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.Extensions.Hosting;
using Optosense.Edm.Core.AspNet.Auth;

namespace Optosense.Edm.Core.AspNet.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : AuthControllerBase
    {
        private readonly ILogger<AuthController> _logger;
        private readonly IMapper _mapper;
        private readonly IHostEnvironment _env;

        public AuthController(ILogger<AuthController> logger, IMapper mapper, IConfiguration configuration, IHostEnvironment env) : base(configuration) 
        {
            _logger = logger;
            _mapper = mapper;
            _env = env;
        }

        [HttpGet("user/name")]
        public UserInfo GetUserInfo()
        {
            return UserInfo;
        }

        [HttpPut("user/role")]
        public async Task<UserInfo> SetUserRole([FromBody] string role)
        {
            if (User.Identity.IsAuthenticated) {
                var availableRole = User.Identity switch
                {
                    WindowsIdentity w => w.Groups.FirstOrDefault(w => w.Value == role)?.Value,
                    ClaimsIdentity c => c.FindAll("Roles").FirstOrDefault(r => r.Value == role)?.Value,
                    _ => default(string)
                } ?? throw new Exception("No such role for the user");

                (User.Identity as ClaimsIdentity).RemoveClaim(User.FindFirst(ClaimTypes.Role));
                (User.Identity as ClaimsIdentity).AddClaim(new Claim(ClaimTypes.Role, role));
                await HttpContext.SignOutAsync();
                await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, User);
                    
                //var userInfo = UserInfo with { Role = availableRole};
                //HttpContext.Session.SetString("UserInfo", JsonConvert.SerializeObject(userInfo));
            }

            return UserInfo;
        }
    }
}
