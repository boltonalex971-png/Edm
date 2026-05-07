using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microprojects.Edm.Ui.Main.Models;

namespace Microprojects.Edm.Ui.Main.Contracts;

public interface ISensorService
{
    Task<IEnumerable<SensorMeasureModel>> FindSensorMeasures(int? minSn, int? maxSn, DateTime? from, DateTime? to);
}