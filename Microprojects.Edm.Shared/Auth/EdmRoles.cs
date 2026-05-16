namespace Microprojects.Edm.Auth
{
    public static class EdmRoles
    {
        public const string Admin = "Admin";
        public const string Technologist = "Technologist";
        public const string Operator = "Operator";
        public const string RemoteService = "RemoteService";

        public static readonly string[] AllUserRoles = [Admin, Technologist, Operator];
    }
}
