namespace Microprojects.Edm.Shared.Contracts;

// Surfaces the current request's user identity into services for
// group-based visibility filtering. Implementations vary by host
// (Windows-auth + JWT in WebApi today; tests can stub).
public interface IUserService
{
    string? GetUserName();
    string[] GetUserGroups();
    string? GetUserRole();

    // True when the current user holds the Admin role and should bypass
    // group-based visibility filters. Mirrors the convention that anyone
    // who can configure access lists must always be able to see the
    // folders/entities they configured.
    bool IsAdmin();
}
