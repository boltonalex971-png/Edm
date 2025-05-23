using System;
using Microprojects.Edm.Ui.Logistics.Contracts;
using Microprojects.Edm.Ui.Logistics.Models;
using Microprojects.Edm.Ui.Logistics.Persistence;

namespace Microprojects.Edm.Ui.Logistics.Services;

public class SpecificationService : ServiceBase<Specification>, ISpecificationService
{
    public SpecificationService()
    {
    }

    public SpecificationService(LogisticsContext db, IUserService userService) : base(db, userService)
    {
    }
}