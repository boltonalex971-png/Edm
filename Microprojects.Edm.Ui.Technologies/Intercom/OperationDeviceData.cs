using System;
using System.Collections.Generic;

namespace Microprojects.Edm.Ui.Technologies.Intercom;

public class OperationDeviceData : OperationDataBase
{
    public Guid OperationHostDeviceId { get; set; }
    public DateTime ScheduledAt { get; set; }
    public DateTime ExecutedAt { get; set; }
    public string Request { get; set; }
    public string Response { get; set; }
    public string Status { get; set; }
    public bool IsValid { get; set; }
    public Dictionary<string, object> Parameters { get; set; }
}
