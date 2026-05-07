namespace Microprojects.Edm.Ui.Technologies.Intercom;

public enum OperationLifecycleActions
{
    Start,
    Stop,
    Pause,
    Resume,
    Cancel,
    Complete
}

public enum OperationLifecycleType
{
    Action,
    Notification,
    Warning,
    Error
}

public class OperationLifecycleData : OperationDataBase
{
    public OperationLifecycleActions Action { get; set; }
    public OperationLifecycleType Type { get; set; }
    public string Message { get; set; }
}