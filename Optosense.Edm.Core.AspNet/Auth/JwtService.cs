using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Security.Principal;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace Optosense.Edm.Core.AspNet.Auth
{
    public interface IJwtService
    {
        string GenerateToken(ClaimsPrincipal principal, string overrideRole = null);
    }

    public class JwtService : IJwtService
    {
        private readonly IConfiguration _configuration;

        public JwtService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public string GenerateToken(ClaimsPrincipal principal, string overrideRole = null)
        {
            var jwtSettings = _configuration.GetSection("Edm:Auth:Jwt");
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["Key"]));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>();
            var groupNames = new List<string>();
            
            if (principal.Identity is WindowsIdentity windowsIdentity)
            {
                claims.Add(new Claim(JwtRegisteredClaimNames.Sub, windowsIdentity.Name));
                claims.Add(new Claim("name", windowsIdentity.Name));

                foreach (var group in windowsIdentity.Groups)
                {
                    try
                    {
                        var name = group.Translate(typeof(NTAccount)).Value;
                        var index = name.LastIndexOf('\\');
                        groupNames.Add(index >= 0 ? name.Substring(index + 1) : name);
                    }
                    catch
                    {
                        // Skip groups that cannot be translated
                    }
                }

                var root = _configuration.GetSection("Edm:Auth").GetValue<string>("DivisionsRoot");
                var divisions = groupNames
                    .Where(g => g.Contains(root))
                    .Select(g => g.Replace(root, string.Empty))
                    .ToList();

                foreach (var division in divisions)
                {
                    claims.Add(new Claim("Divisions", division));
                }

                var roles = _configuration.GetSection("Edm:Auth:Roles").GetChildren()
                    .Where(c => groupNames.Any(g => g.Contains(c.Value)))
                    .Select(c => c.Key).ToList();
                
                foreach (var role in roles)
                {
                    claims.Add(new Claim("Roles", role));
                }
                
                if (!string.IsNullOrEmpty(overrideRole) && roles.Contains(overrideRole))
                {
                    claims.Add(new Claim("role", overrideRole));
                }
                else if (roles.Any())
                {
                    claims.Add(new Claim("role", roles.First()));
                }
            }
            else
            {
                var existingClaims = principal.Claims.ToList();
                if (!string.IsNullOrEmpty(overrideRole))
                {
                    var roles = existingClaims.Where(c => c.Type == "Roles").Select(c => c.Value).ToList();
                    if (roles.Contains(overrideRole))
                    {
                        existingClaims.RemoveAll(c => c.Type == "role");
                        existingClaims.Add(new Claim("role", overrideRole));
                    }
                }

                claims.AddRange(existingClaims);
                if (principal.Identity?.Name != null && !claims.Exists(c => c.Type == JwtRegisteredClaimNames.Sub))
                {
                    claims.Add(new Claim(JwtRegisteredClaimNames.Sub, principal.Identity.Name));
                }
            }

            var descriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Issuer = jwtSettings["Issuer"],
                Audience = jwtSettings["Audience"],
                Expires = DateTime.UtcNow.AddMinutes(double.Parse(jwtSettings["ExpiryMinutes"] ?? "60")),
                SigningCredentials = creds
            };

            var handler = new JsonWebTokenHandler();
            return handler.CreateToken(descriptor);
        }
    }
}
