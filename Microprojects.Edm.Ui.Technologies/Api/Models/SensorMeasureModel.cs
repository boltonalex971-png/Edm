using System;

namespace Microprojects.Edm.Ui.Technologies.Models;

public class SensorMeasureModel
{
    public int? Sn { get; set; }
    public DateTime Started { get; set; }
    public long Count { get; set; }
    public int OperationHostDeviceId { get; set; }
    public int OperationId { get; set; }
    public string Addr { get; set; }
    public int? Signal { get; set; }
    public int? Ref { get; set; }
    public int? Pw { get; set; }
    //public string Message { get; set; }
}