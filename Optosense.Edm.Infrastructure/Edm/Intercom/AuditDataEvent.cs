using Optosense.Edm.Infrastructure.Models;

namespace Optosense.Edm.Infrastructure.Edm.Intercom;

public class AuditDataEvent : OperationDataEvent
{
    public AuditDataEvent()
    {
        Type = OperationDataType.Audit;
    }
}