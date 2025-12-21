using Microprojects.Edm.Intercom;

namespace Microprojects.Edm.Drivers;

public interface INeedIntercom
{
    IIntercom  Intercom { get; set; }
}