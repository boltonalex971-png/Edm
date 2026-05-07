using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microprojects.Edm.Ui.Technologies.Models;

namespace Microprojects.Edm.Ui.Technologies.Contracts;

public interface ISensorService
{
    Task<IEnumerable<SensorMeasureModel>> FindSensorMeasures(int? minSn, int? maxSn, DateTime? from, DateTime? to);
}