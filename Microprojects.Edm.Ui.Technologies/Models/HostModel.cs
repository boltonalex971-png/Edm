namespace Microprojects.Edm.Ui.Technologies.Models
{
    public class HostModel : Host
    {
        // True when a live peer matches this host's Url. Distinct from
        // Host.Active (entity field, also set by HostService.GetAll).
        public new bool Active { get; set; }
        public string Version { get; set; }
        public string Mode { get; set; }
        public string Environment { get; set; }
        public int UiPort { get; set; }
    }
}
