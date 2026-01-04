using System;
using Optosense.Edm.Core.Models;

namespace Optosense.Edm.Intercom.Events;

public class LifecycleEvent
{
    public  string State { get; set; }
    public DateTime StateTimestamp { get; set; } = DateTime.UtcNow;
}