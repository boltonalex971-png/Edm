using Optosense.Edm.Domain.Models;
using System;

namespace Microprojects.Edm.Ui.Main.Models
{
    public class ProfileViewModel
    {
        public int Id { get; set; }

        public string Name { get; set; }
        public string Description { get; set; }
        public string Input{ get; set; }
        public string Output { get; set; }
        public Guid ProfilerGuid { get; set; }
        public string ProfilerName { get; set; }
    }
}
