using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Core.Models
{
    public record UserInfo
    {
        public string Name { get; set; } = "User";
        public IEnumerable<UserClaim> Claims { get; set; } = [ new UserClaim { Sid = "1", Name = "Group 1"} ];
        public string Role { get; set; } = "Admin";
        public IEnumerable<string> Roles { get; set; } = ["Admin", "Technologist", "Operator"];
        public IEnumerable<string> Divisions { get; set; } = ["Group 1"];
    }
}
