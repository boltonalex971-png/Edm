using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Microprojects.Edm.Ui.Technologies.Models;
using Optosense.Edm.Plugins;
using System.Collections.Generic;
using System.Linq;
using Optosense.Edm.Core.Models;
using Microprojects.Edm.Ui.Technologies.Models;

namespace Microprojects.Edm.Ui.Technologies.Intercom;

public class InfrastructureModelsProfile : AutoMapper.Profile
{
    public InfrastructureModelsProfile()
    {
        CreateMap<OperationCriterion, OperationAuditData>();
        CreateMap<Record, OperationDeviceData>();
    }
}