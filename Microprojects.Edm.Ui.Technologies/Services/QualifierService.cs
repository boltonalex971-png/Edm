using Microprojects.Edm.Shared.Contracts;
using Microprojects.Edm.Shared.Services;
using Microprojects.Edm.Ui.Technologies.Contracts;
using Microprojects.Edm.Ui.Technologies.Models;
using Microprojects.Edm.Ui.Technologies.Persistence;

namespace Microprojects.Edm.Ui.Technologies.Services
{
    public class QualifierService : ServiceBase<TechnologiesContext, Qualifier>, IQualifierService
    {
        public QualifierService(TechnologiesContext db, IUserService userService) : base(db, userService)
        {
        }
    }
}
