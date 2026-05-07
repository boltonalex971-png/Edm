using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microprojects.Edm.Ui.Technologies.Contracts;
using Microprojects.Edm.Ui.Technologies.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Microprojects.Edm.Ui.Technologies.Api;

[AllowAnonymous]
[ApiController]
[Route("api/technologies/[controller]")]
public class SensorsController(ISensorService sensorService) : ControllerBase
{
    [HttpGet]
    public string IsAlive()
    {
        return "Ok";
    }
    
    [HttpGet("{sn:int}")]
    public async Task<SensorMeasureModel> GetSensorMeasures(int sn)
    {
        return (await sensorService.FindSensorMeasures(sn, null, null, null))
            .OrderByDescending(r => r.OperationId)
            .FirstOrDefault();
    }

    [HttpPost]
    public async Task<IEnumerable<SensorMeasureModel>> FindSensorMeasures(SensorMeasureSearchModel model)
    {
        return await sensorService.FindSensorMeasures(model.MinSn, model.MaxSn, model.From, model.To);
    }
}