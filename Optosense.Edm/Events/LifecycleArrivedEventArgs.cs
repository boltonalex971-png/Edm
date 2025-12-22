using System;
using Optosense.Edm.Core.Models;

namespace Optosense.Edm.Events;

public class LifecycleArrivedEventArgs : EventArgs
{
    public  OperationState State{ get; set; }
    public DateTime StateTimestamp { get; set; }
}