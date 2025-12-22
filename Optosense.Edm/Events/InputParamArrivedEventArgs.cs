using System;

namespace Optosense.Edm.Events;

public class InputParamArrivedEventArgs : EventArgs
{
    public string Param { get; set; }
    public object Value { get; set; }
    public DateTime ArrivedAt { get; set; }
}