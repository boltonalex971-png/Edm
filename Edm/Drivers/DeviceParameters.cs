namespace Microprojects.Edm.Drivers;

public class DeviceParameters
{
    public string StoreChannel { get; set; }
    public string ParametersChannel { get; set; }
    public dynamic DriverOptions { get; set; }
    public string Profile { get; set; }
    public string InputParameters { get; set; }
    public string OutputParameters { get; set; }
}