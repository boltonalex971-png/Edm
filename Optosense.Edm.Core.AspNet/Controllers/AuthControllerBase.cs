using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Optosense.Edm.Core.Auditing;
using Optosense.Edm.Core.Contracts;
using Optosense.Edm.Core.Models;
using Optosense.Edm.Domain.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Primitives;
using System.Security.Claims;
using Optosense.Edm.Core.AspNet.Auth;

namespace Optosense.Edm.Core.AspNet.Controllers
{
    public class AuthControllerBase : ControllerBase
    {
        private readonly IConfiguration _configuration;

        public UserInfo UserInfo
        {
            get
            {
                // Defense-in-depth: in production, refuse to surface the
                // Windows identity to a request whose Origin doesn't match
                // Host (would catch an XHR from another site abusing cached
                // Negotiate creds). Skipped in development because the rsbuild
                // dev proxy forwards Origin/Host in a way the EndsWith check
                // can mis-classify; CORS already gates who can call the API.
                var env = HttpContext.RequestServices.GetService<IHostEnvironment>();
                if (env?.IsDevelopment() != true &&
                    !string.IsNullOrEmpty(Request.Headers.Origin.ToString()) &&
                    !Request.Headers.Origin.ToString().EndsWith(Request.Headers.Host))
                {
                    return new UserInfo();
                }

                var userInfo = new UserInfo();
                if (HttpContext.User.Identity is ClaimsIdentity claimsIdentity)
                {
                    var roles = claimsIdentity.FindAll("Roles")
                        .Select(c => c.Value)
                        .ToList();
                    var divisions = claimsIdentity.FindAll("Divisions")
                        .Select(c => c.Value)
                        .ToList();

                    var selectedRole = HttpContext.Session.GetString("SelectedRole");
                    var currentRole = (selectedRole != null && roles.Contains(selectedRole))
                        ? selectedRole
                        : (claimsIdentity.FindFirst("role")?.Value ?? claimsIdentity.FindFirst(ClaimTypes.Role)?.Value ?? roles.FirstOrDefault());

                    userInfo = new UserInfo
                    {
                        Name = claimsIdentity.Name,
                        Roles = roles,
                        Role = currentRole,
                        Divisions = divisions
                    };
                }

                return userInfo;
            }
        }

        public AuthControllerBase(IConfiguration configuration)
        {
            _configuration = configuration;
        }
    }
}
