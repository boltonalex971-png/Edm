using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microprojects.Edm.Ui.Main.Contracts;
using Microprojects.Edm.Ui.Main.Models;
using Microsoft.AspNetCore.Mvc;

namespace Microprojects.Edm.Ui.Main.Api;

[ApiController]
[Route("api/[controller]")]
public class SensorsController(ISensorService sensorService) : ControllerBase
{
    [HttpGet]
    public string IsAlive()
    {
        return "Ok";
    }
    
    [HttpPost]
    public async Task<IEnumerable<SensorMeasureModel>> FindSensorMeasures(SensorMeasureSearchModel model)
    {
        return await sensorService.FindSensorMeasures(model.MinSn, model.MaxSn, model.From, model.To);
    }
}