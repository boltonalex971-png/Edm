namespace Microprojects.Edm.Ui.Logistics.Contracts;

public interface IUserService
{
    string? GetUserName();
    string[] GetUserGroups();
    string? GetUserRole();

    /// <summary>
    /// True when the current user holds the Admin role and should bypass
    /// group-based visibility filters. Mirrors the convention that anyone
    /// who can configure access lists must always be able to see the
    /// folders/entities they configured.
    /// </summary>
    bool IsAdmin();
}