using System;
using Microprojects.Edm.Ui.Logistics.Contracts;
using Microprojects.Edm.Ui.Logistics.Models;
using Microprojects.Edm.Ui.Logistics.Persistence;

namespace Microprojects.Edm.Ui.Logistics.Services;

public class NomenclatureService : ServiceBase<Nomenclature>, INomenclatureService
{
    public NomenclatureService()
    {
    }

    public NomenclatureService(LogisticsContext db) : base(db)
    {
    }
}