using System;
using System.Linq;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microprojects.Edm.Auth;

namespace Microprojects.Edm.Controllers
{
    public class AuthControllerBase : ControllerBase
    {
        private readonly IConfiguration _configuration;

        public UserInfo UserInfo
        {
            get
            {
                // CSRF guard: reject when Origin's host differs from Host (port ignored so cross-port dev proxies work).
                var origin = Request.Headers.Origin.ToString();
                if (!string.IsNullOrEmpty(origin))
                {
                    var hostHeader = Request.Headers.Host.ToString();
                    var hostName = hostHeader.Split(':')[0];
                    if (!Uri.TryCreate(origin, UriKind.Absolute, out var originUri)
                        || !string.Equals(originUri.Host, hostName, StringComparison.OrdinalIgnoreCase))
                    {
                        return new UserInfo();
                    }
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
