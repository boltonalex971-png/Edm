using System.Linq;
using System.Runtime.Versioning;
using System.Security.Claims;
using Microprojects.Edm.Auth;
using Microprojects.Edm.Shared.Contracts;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Microprojects.Edm.Shared.Services;

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

    public bool IsAdmin() => GetUserRole() == EdmRoles.Admin;

    // Returns the user's active role, honoring a session-selected role
    // when present (matches AuthControllerBase.UserInfo). Falls back to
    // the first role claim otherwise.
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
        // Defense-in-depth CSRF guard: in production, refuse to surface the
        // Windows identity when Origin's host doesn't match Host. Skipped
        // in dev because the rsbuild proxy preserves Origin while CORS
        // already controls who can talk to the API.
        if (!_env.IsDevelopment() &&
            !string.IsNullOrEmpty(request.Headers.Origin.ToString()) &&
            !request.Headers.Origin.ToString().EndsWith(request.Headers.Host))
        {
            return new UserInfo();
        }

        var userInfo = new UserInfo();
        if (context.User.Identity is ClaimsIdentity claimsIdentity)
        {
            // JwtService emits already-stripped division names as "Divisions"
            // claims; mirror AuthControllerBase rather than re-deriving them
            // from a "Groups" claim that no longer exists.
            var divisions = claimsIdentity.FindAll("Divisions")
                .Select(c => c.Value)
                .ToList();
            var roles = claimsIdentity.FindAll("Roles")
                .Select(c => c.Value)
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
