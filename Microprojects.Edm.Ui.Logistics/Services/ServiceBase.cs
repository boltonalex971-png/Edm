using Microprojects.Edm.Ui.Logistics.Persistence;

namespace Microprojects.Edm.Ui.Logistics.Services;

// Thin Logistics-side adapter binding the shared ServiceBase generic to
// LogisticsContext. Lets existing Logistics services (NomenclatureService,
// OrderService, ItemService, …) keep writing `: ServiceBase<Order>` instead
// of `: Microprojects.Edm.Shared.Services.ServiceBase<LogisticsContext, Order>`.
public class ServiceBase<TEntity> : Microprojects.Edm.Shared.Services.ServiceBase<LogisticsContext, TEntity>
    where TEntity : class, IDomainObject
{
    public ServiceBase() { }

    public ServiceBase(LogisticsContext db, IUserService userService) : base(db, userService) { }
}
