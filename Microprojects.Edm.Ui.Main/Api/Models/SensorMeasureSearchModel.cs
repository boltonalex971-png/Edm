using System;

namespace Microprojects.Edm.Ui.Main.Models;

public class SensorMeasureSearchModel
{
    public int? MinSn { get; set; }
    public int? MaxSn { get; set; }
    public DateTime? From  { get; set; }
    public DateTime? To  { get; set; }
}