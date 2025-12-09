using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Optosense.Edm.Domain.Models;
using Optosense.Edm.Plugins;
using System.Collections.Generic;
using System.Linq;
using Optosense.Edm.Core.Models;

namespace Optosense.Edm.Infrastructure.Models;

public class InfrastructureModelsProfile : AutoMapper.Profile
{
    public InfrastructureModelsProfile()
    {
        CreateMap<OperationCriterion, OperationAuditData>();
        CreateMap<Record, OperationDeviceData>();
    }
}