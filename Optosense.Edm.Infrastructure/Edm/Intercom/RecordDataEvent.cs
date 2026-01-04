using Optosense.Edm.Infrastructure.Models;

namespace Optosense.Edm.Infrastructure.Edm.Intercom;

public class RecordDataEvent : OperationDataEvent
{
    public RecordDataEvent()
    {
        Type = OperationDataType.Device;
    }
}