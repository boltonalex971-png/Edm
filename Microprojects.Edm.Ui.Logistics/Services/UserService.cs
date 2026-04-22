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
    private readonly IHostEnvironment _env;
    private readonly UserInfo _userInfo;

    public UserService(IHttpContextAccessor httpContextAccessor, ILogger<UserService> logger,
        IConfiguration configuration, IHostEnvironment env)
    {
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
        _configuration = configuration;
        _env = env;
        _userInfo = GetUserInfo();
    }


    public string? GetUserName() => _userInfo.Name;

    public string[] GetUserGroups() => _userInfo.Divisions.ToArray() ?? [];

    /// <summary>
    /// Returns the user's active role, honoring a session-selected role if the
    /// user has one (matches <c>AuthControllerBase.UserInfo</c>). Falls back to
    /// the first role claim when no session selection is present.
    /// </summary>
    public string? GetUserRole()
    {
        var session = _httpContextAccessor.HttpContext?.Session;
        if (session != null)
        {
            var selected = session.GetString("SelectedRole");
            if (!string.IsNullOrEmpty(selected) && _userInfo.Roles.Contains(selected))
            {
                return selected;
            }
        }
        return _userInfo.Role;
    }

    [SupportedOSPlatform("windows")]
    private UserInfo GetUserInfo()
    {
        var context = _httpContextAccessor.HttpContext;
        var request = _httpContextAccessor.HttpContext?.Request;
        // Defense-in-depth: in production, refuse to surface the Windows
        // identity to a request whose Origin doesn't match Host (would catch
        // an XHR from another site abusing cached Negotiate creds). Skipped in
        // development because the rsbuild dev proxy preserves Origin while
        // CORS already controls who can talk to the API.
        if (!_env.IsDevelopment() &&
            !string.IsNullOrEmpty(request.Headers.Origin.ToString()) &&
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