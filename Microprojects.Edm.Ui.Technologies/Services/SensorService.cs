using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microprojects.Edm.Ui.Technologies.Contracts;
using Microprojects.Edm.Ui.Technologies.Models;
using Microsoft.EntityFrameworkCore;
using Microprojects.Edm.Ui.Technologies.Persistence;

namespace Microprojects.Edm.Ui.Technologies.Services;

public class SensorService(TechnologiesContext db) : ISensorService
{
    public async Task<IEnumerable<SensorMeasureModel>> FindSensorMeasures(int? minSn, int? maxSn, DateTime? from, DateTime? to)
    {
        var noSn = minSn is null && maxSn is null ?  1 : 0;
        var noDate = from is null && to is null ? 1 : 0;
        var request = db.Database
            .SqlQuery<SensorMeasureModel>(
                @$" SELECT 
 						[Count],
						OperationHostDeviceId,
						OperationId,
						Started,
						Addr,
						Sn,
						Signal,
						Ref,
						Pw
						--Message
                    FROM dbo.SensorMeasureView
                    WHERE ({noSn}=1 OR Sn>={minSn ?? maxSn} AND Sn<={maxSn ?? minSn}) AND
                          ({noDate}=1 OR Started>={from ?? to} AND Started<={to ?? from})
                  ");
        var result = await request.ToListAsync();
        return result;
    }
}