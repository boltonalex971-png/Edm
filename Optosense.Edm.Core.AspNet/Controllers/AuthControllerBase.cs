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
using Microsoft.Extensions.Configuration;
using System.Security.Claims;
using System.Security.Principal;
using System.Runtime.Versioning;
using Optosense.Edm.Core.AspNet.Auth;
using Microsoft.IdentityModel.Tokens;

namespace Optosense.Edm.Core.AspNet.Controllers
{
    public class AuthControllerBase : ControllerBase
    {
        private readonly IConfiguration _configuration;
        
        [SupportedOSPlatform("windows")]
        public UserInfo UserInfo
        {
            get
            {
                if (!Request.Headers["Origin"].ToString().IsNullOrEmpty() && 
                    !Request.Headers["Origin"].ToString().EndsWith(Request.Headers["Host"]))
                {
                    return new UserInfo();
                }

                var userInfo = new UserInfo();
                if (HttpContext.User.Identity is WindowsIdentity identity)
                {
                    var claims = identity.Groups.Select(g => new UserClaim
                    {
                        Sid = g.Value,
                        Name = g.Translate(typeof(NTAccount)).Value
                    }).ToList();
                    var roles = _configuration.GetSection("Edm:Auth:Roles").GetChildren()
                        .Where(c => claims.Any(l => l.Name.Contains(c.Value)))
                        .Select(c => c.Key).ToList();
                    var root = _configuration.GetSection("Edm:Auth").GetValue<string>("DivisionsRoot");
                    var divisions = claims
                        .Where(c => c.Name.Contains(root))
                        .Select(c => new UserClaim { Name = c.Name.Replace(root, string.Empty), Sid = c.Sid})
                        .ToList();
                    userInfo = new UserInfo
                    {
                        Name = identity.Name,
                        Claims = claims,
                        Roles = roles,
                        Role = roles.FirstOrDefault(),
                        Divisions = divisions,
                    };
                } 
                else if (HttpContext.User.Identity is ClaimsIdentity claimsIdentity)
                {
                    userInfo = new UserInfo
                    {
                        Name = claimsIdentity.Name,
                        Claims = claimsIdentity.FindAll("Groups")
                            .Select((g, i) => new UserClaim { Sid = (i + 1).ToString(), Name = g.ToString() })
                            .ToList(),
                        Roles = claimsIdentity.FindAll("Roles")
                            .Select(c => c.Value)
                            .ToList(),
                        Role = claimsIdentity.FindFirst(ClaimTypes.Role)?.Value,
                        Divisions = claimsIdentity.FindAll("Groups")
                            .Select((g, i) => new UserClaim { Sid = (i + 1).ToString(), Name = g.ToString() })
                            .ToList()
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
