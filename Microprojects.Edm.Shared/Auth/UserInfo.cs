using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Microprojects.Edm.Auth
{
    public record UserInfo
    {
        // Defaults represent an *unauthenticated / fallback* user — deliberately
        // empty so a code path that returns `new UserInfo()` (e.g. the
        // cross-origin guard) cannot accidentally hand the caller admin
        // privileges or a fabricated identity.
        public string Name { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public IEnumerable<string> Roles { get; set; } = [];
        public IEnumerable<string> Divisions { get; set; } = [];
        /// <summary>
        /// Get user group list. Null means User current Admin role
        /// </summary>
        public IEnumerable<string> Groups => Role == "Admin" ? null : Divisions;
    }
}
