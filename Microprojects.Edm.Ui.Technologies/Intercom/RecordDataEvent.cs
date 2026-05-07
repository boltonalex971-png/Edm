using Microprojects.Edm.Ui.Technologies.Intercom;

namespace Microprojects.Edm.Ui.Technologies.Intercom;

public class RecordDataEvent : OperationDataEvent
{
    public RecordDataEvent()
    {
        Type = OperationDataType.Device;
    }
}