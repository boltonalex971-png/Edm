namespace Microprojects.Edm.Auth
{
    /// <summary>
    /// Shorthand for the dominant 3-role combination: any human user (Admin,
    /// Technologist, or Operator). Excludes service-to-service callers.
    /// </summary>
    public sealed class RequireAnyUserRoleAttribute : RequireRolesAttribute
    {
        public RequireAnyUserRoleAttribute() : base(EdmRoles.AllUserRoles)
        {
        }
    }
}
