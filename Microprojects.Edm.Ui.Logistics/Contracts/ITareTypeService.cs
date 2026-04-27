using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microprojects.Edm.Ui.Logistics.Models;

namespace Microprojects.Edm.Ui.Logistics.Contracts;

public interface ITareTypeService : IGenericService<TareType>
{
    Task<IEnumerable<NomenclatureTareType>> GetAllowedNomenclatures(Guid tareTypeId);
    Task<NomenclatureTareType> AddAllowedNomenclature(Guid tareTypeId, Guid nomenclatureId);
    Task<bool> RemoveAllowedNomenclature(Guid tareTypeId, Guid linkId);
}
