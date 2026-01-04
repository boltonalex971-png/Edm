using System;

namespace Optosense.Edm.Intercom.Events;

public class InputParamEvent
{
    public string Param { get; set; }
    public object Value { get; set; }
    public DateTime ArrivedAt { get; set; }
}