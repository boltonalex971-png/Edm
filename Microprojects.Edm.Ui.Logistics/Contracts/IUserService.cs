namespace Microprojects.Edm.Ui.Logistics.Contracts;

public interface IUserService
{
    string? GetUserName();
    string[] GetUserGroups();
    string? GetUserRole();
}