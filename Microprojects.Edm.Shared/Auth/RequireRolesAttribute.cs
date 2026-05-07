using System;
using System.Linq;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace Microprojects.Edm.Auth
{
    /// <summary>
    /// Authorizes the action when the user's *active* role (the
    /// session-selected role honored by <c>AuthControllerBase.UserInfo</c>)
    /// matches one of the listed roles. Falls back to the identity's role
    /// claim when no session selection is present.
    /// </summary>
    /// <remarks>
    /// The framework's <c>[Authorize(Roles = "...")]</c> evaluates against
    /// every role claim on the identity — but the system models a user as
    /// acting in *one* selected role at a time (admin can switch between
    /// Operator/Technologist/Admin). This attribute matches that model: the
    /// user is allowed only if their currently-selected role is in the list.
    /// </remarks>
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false, Inherited = true)]
    public class RequireRolesAttribute : Attribute, IAuthorizationFilter
    {
        private readonly string[] _allowedRoles;

        public RequireRolesAttribute(params string[] allowedRoles)
        {
            _allowedRoles = allowedRoles ?? Array.Empty<string>();
        }

        public void OnAuthorization(AuthorizationFilterContext context)
        {
            var http = context.HttpContext;
            if (http.User.Identity?.IsAuthenticated != true)
            {
                context.Result = new UnauthorizedResult();
                return;
            }

            var role = ResolveActiveRole(http);
            if (string.IsNullOrEmpty(role) ||
                !_allowedRoles.Contains(role, StringComparer.Ordinal))
            {
                context.Result = new ForbidResult();
            }
        }

        private static string? ResolveActiveRole(HttpContext http)
        {
            var session = http.Session;
            if (session != null)
            {
                var selected = session.GetString("SelectedRole");
                if (!string.IsNullOrEmpty(selected))
                {
                    return selected;
                }
            }

            if (http.User.Identity is ClaimsIdentity identity)
            {
                return identity.FindFirst("role")?.Value
                       ?? identity.FindFirst(ClaimTypes.Role)?.Value
                       ?? identity.FindFirst("Roles")?.Value;
            }
            return null;
        }
    }
}
