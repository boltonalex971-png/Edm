using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microprojects.Edm.Ui.Logistics.Models;

namespace Microprojects.Edm.Ui.Logistics.Contracts;

public interface INomenclatureService : IGenericService<Nomenclature>
{
    Task<IEnumerable<NomenclatureTareType>> GetAllowedTareTypes(Guid nomenclatureId);
    Task<NomenclatureTareType> AddAllowedTareType(Guid nomenclatureId, Guid tareTypeId, bool makeDefault);
    Task<NomenclatureTareType> SetAllowedTareTypeDefault(Guid nomenclatureId, Guid linkId, bool makeDefault);
    Task<bool> RemoveAllowedTareType(Guid nomenclatureId, Guid linkId);
}
