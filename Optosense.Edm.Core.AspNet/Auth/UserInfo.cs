using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Core.AspNet.Auth
{
    public record UserInfo
    {
        public string Name { get; set; } = "User";
        public string Role { get; set; } = "Admin";
        public IEnumerable<string> Roles { get; set; } = ["Admin", "Technologist", "Operator"];
        public IEnumerable<string> Divisions { get; set; }
        /// <summary>
        /// Get user group list. Null means User current Admin role
        /// </summary>
        public IEnumerable<string> Groups => Role == "Admin" ? null : Divisions;
    }
}
