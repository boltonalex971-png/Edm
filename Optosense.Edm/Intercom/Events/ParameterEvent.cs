using System.Collections.Generic;

namespace Optosense.Edm.Intercom.Events;

public class ParameterEvent
{
    public string Key { get; set; }
    public object Value { get; set; }
}