using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Core.Models
{
    public class UserInfo
    {
        public string Name { get; set; }
        public IEnumerable<UserClaim> Claims { get; set; }
        public string Role { get; set; }
        public IEnumerable<string> Roles { get; set; }
        public IEnumerable<string> Divisions { get; set; }
    }
}
