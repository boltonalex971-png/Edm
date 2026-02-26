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

    public string[] GetUserGroups() => _userInfo.Divisions.ToArray() ?? [];

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
        if (context.User.Identity is ClaimsIdentity claimsIdentity)
        {
            var root = _configuration.GetSection("Edm:Auth").GetValue<string>("DivisionsRoot");
            var groups = claimsIdentity.FindAll("Groups")
                .Select(g => g.Value)
                .ToList();
            var roles = claimsIdentity.FindAll("Roles")
                .Select(c => c.Value)
                .ToList();
            var divisions = groups
                .Where(g => g.Contains(root))
                .Select(g => g.Replace(root, string.Empty))
                .ToList();

            userInfo = new UserInfo
            {
                Name = claimsIdentity.Name,
                Roles = roles,
                Role = roles.FirstOrDefault() ?? claimsIdentity.FindFirst(ClaimTypes.Role)?.Value,
                Divisions = divisions
            };
        }

        return userInfo;
    }
}