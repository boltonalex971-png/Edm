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
using Microprojects.Edm.Models;
using Microprojects.Edm.Domain;
using Microsoft.Extensions.Configuration;
using System.Security.Principal;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.Extensions.Hosting;
using Microprojects.Edm.Auth;
using Microprojects.Edm.Controllers;
using Microprojects.Edm.Host.Auth;

namespace Microprojects.Edm.Host.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : AuthControllerBase
    {
        private readonly ILogger<AuthController> _logger;
        private readonly IMapper _mapper;
        private readonly IHostEnvironment _env;
        private readonly IJwtService _jwtService;

        public AuthController(ILogger<AuthController> logger, IMapper mapper, IConfiguration configuration, IHostEnvironment env, IJwtService jwtService) : base(configuration)
        {
            _logger = logger;
            _mapper = mapper;
            _env = env;
            _jwtService = jwtService;
        }

        [HttpGet("user/name")]
        public UserInfo GetUserInfo()
        {
            return UserInfo;
        }

        [HttpPut("user/role")]
        public async Task<IActionResult> SetUserRole([FromBody] string role)
        {
            if (User.Identity.IsAuthenticated)
            {
                var userInfo = UserInfo;
                if (!userInfo.Roles.Contains(role))
                {
                    throw new Exception("No such role for the user");
                }

                var token = _jwtService.GenerateToken(User, role);
                HttpContext.Session.SetString("SelectedRole", role);
                Response.Cookies.Append("X-Auth-Token", token, new CookieOptions
                {
                    HttpOnly = false,
                    Secure = true,
                    SameSite = SameSiteMode.Strict,
                    Expires = DateTimeOffset.UtcNow.AddMinutes(10)
                });
                return Ok();
            }

            return Unauthorized();
        }
    }
}
