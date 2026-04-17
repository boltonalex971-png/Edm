using System;
using Microprojects.Edm.Ui.Logistics.Contracts;
using Microprojects.Edm.Ui.Logistics.Models;
using Microprojects.Edm.Ui.Logistics.Persistence;

namespace Microprojects.Edm.Ui.Logistics.Services;

public class TareTypeService : ServiceBase<TareType>, ITareTypeService
{
    public TareTypeService()
    {
    }

    public TareTypeService(LogisticsContext db, IUserService userService) : base(db, userService)
    {
    }

    public override async Task<TareType> Save(TareType entity)
    {
        var eps = 1e-9;

        if (entity.Countable && entity.SizeX > 0)
        {
            entity.Capacity = (entity.SizeX ?? 1) * (entity.SizeY ?? 1) * (entity.SizeZ ?? 1);
        }
        else if (entity.Countable)
        {
            // Countable bulk tares store piece-count in Capacity -> must be integer.
            var rounded = Math.Round(entity.Capacity);
            if (entity.Capacity < 1 || Math.Abs(entity.Capacity - rounded) > eps)
            {
                throw new EdmException("Capacity must be a positive integer for countable bulk tare types.");
            }

            entity.Capacity = rounded;
        }

        return await base.Save(entity);
    }
}
