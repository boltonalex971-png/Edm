using System;

namespace Microprojects.Edm.Ui.Technologies.Models
{
    public class ProfileViewModel
    {
        public Guid Id { get; set; }

        public string Name { get; set; }
        public string Description { get; set; }
        public string Input { get; set; }
        public string Output { get; set; }
        public Guid ProfilerGuid { get; set; }
        public string ProfilerName { get; set; }
    }
}
