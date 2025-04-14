namespace Microprojects.Edm.Ui.Logistics.Models;

public class Changelog : DomainObject
{
    public Guid ObjectId { get; set; }
    public string Author { get; set; }
    public string JsonValue { get; set; }
    public DateTime Timestamp { get; set; }
}