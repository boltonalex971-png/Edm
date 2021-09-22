using Optosense.Edm.Domain.Models;
using System;

namespace Optosense.Edm.Webui.Models
{
    public class ProfileViewModel
    {
        public int Id { get; set; }

        public string Name { get; set; }
        public string Description { get; set; }
        public Guid ProfilerGuid { get; set; }
        public string ProfilerName { get; set; }
    }
}
