using System.Runtime.Versioning;
using System.Security.Claims;
using System.Security.Principal;
using Microprojects.Edm.Ui.Logistics.Contracts;
using Optosense.Edm.Core.AspNet.Auth;
using Optosense.Edm.Core.AspNet.Controllers;

namespace Microprojects.Edm.Ui.Logistics.Services;

public class UserService : IUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<UserService> _logger;
    private readonly IConfiguration _configuration;
    private readonly UserInfo _userInfo;

    public UserService(IHttpContextAccessor httpContextAccessor, ILogger<UserService> logger,
        IConfiguration configuration)
    {
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
        _configuration = configuration;
        _userInfo = GetUserInfo();
    }


    public string? GetUserName() => _userInfo.Name;

    public string[] GetUserGroups() => _userInfo.Divisions?.Select(d=>d.Name).ToArray() ?? [];

    [SupportedOSPlatform("windows")]
    private UserInfo GetUserInfo()
    {
        var context = _httpContextAccessor.HttpContext;
        var request = _httpContextAccessor.HttpContext?.Request;
        if (!string.IsNullOrEmpty(request.Headers.Origin.ToString()) &&
            !request.Headers.Origin.ToString().EndsWith(request.Headers.Host))
        {
            return new UserInfo();
        }

        var userInfo = new UserInfo();
        if (context.User.Identity is WindowsIdentity identity)
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
                .Select(c => new UserClaim { Name = c.Name.Replace(root, string.Empty), Sid = c.Sid })
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
        else if (context.User.Identity is ClaimsIdentity claimsIdentity)
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