using System;
using Microprojects.Edm.Models;

namespace Microprojects.Edm.Intercom.Events;

public class LifecycleEvent
{
    public  string State { get; set; }
    public DateTime StateTimestamp { get; set; } = DateTime.UtcNow;
}