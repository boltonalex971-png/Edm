using System.Diagnostics;
//System.Diagnostics.Debugger.Launch();
var stage = args[0];
var options = args[1..]
    .Select(a => a.Split('=', 2))
    .ToDictionary(a => a[0][1..], a => a.Length == 2 ? a[1] : null);
Console.WriteLine(string.Join(", ", options.Select(o => $"{o.Key}={o.Value}")));

switch (stage)
{
    case "/Install":
        Install(options);
        break;
    case "/Uninstall":
        Uninstall(options);
        break;
}

void Install(Dictionary<string, string?> options)
{
    var _serviceName = "edm";
    var _targetDir = options["targetDir"];

    var cmd = new Process();
    // Open firewall ports
    cmd.StartInfo = new ProcessStartInfo("cmd.exe", $"/C \"{_targetDir}OpenFirewallPorts.bat\"")
    {
        WindowStyle = ProcessWindowStyle.Hidden
    };
    cmd.Start();

    // Fix appsettings.json according choosen installation options
    var settingsPath = $"{_targetDir}\\appsettings.json";
    var settings = File.ReadAllText(settingsPath);
    //settings = settings.Replace("[CACHECONNECTIONSTRING]", options["cache"]);
    settings = settings.Replace("[DBCONNECTIONSTRING]", options["db"]?.Replace("\\", "\\\\"));
    settings = settings.Replace("[PRINCIPALURL]", options["principalUrl"]);
    settings = settings.Replace("[CONSOLEURL]", options["consoleUrl"]);
    settings = settings.Replace("[GRPCURL]", options["grpcUrl"]);
    settings = settings.Replace("[MODE]", options["mode"]);
    File.WriteAllText(settingsPath, settings);
    File.Delete($"{_targetDir}\\appsettings.Production.json");
    File.Delete($"{_targetDir}\\appsettings.Development.json");

    // Install EDM as service
    cmd = new Process();
    cmd.StartInfo = new ProcessStartInfo("cmd.exe",
        $"/C sc create {_serviceName} start= auto DisplayName= \"EDM Service\" binPath= \"{_targetDir}Optosense.Edm.WebApi.exe\"")
    {
        WindowStyle = ProcessWindowStyle.Hidden,
    };
    cmd.Start();

    // Wait to give time to start service
    cmd.WaitForExit();
    cmd = new Process();
    cmd.StartInfo = new ProcessStartInfo("cmd.exe", $"/C sc start {_serviceName}")
    {
        WindowStyle = ProcessWindowStyle.Hidden,
    };
    cmd.Start();

    //var sc = new ServiceController("edm");
    //if (sc != null && sc.Status == ServiceControllerStatus.Stopped)
    //{
    //    sc.Start();
    //}

}

void Uninstall(Dictionary<string, string?> options)
{
#if DEBUG
    //System.Diagnostics.Debugger.Launch();
#endif

    var _serviceName = "edm";
    var _targetDir = options["targetDir"];

    var cmd = new Process();
    // Close firewall ports
    cmd.StartInfo = new ProcessStartInfo("cmd.exe", $"/C \"{_targetDir}CloseFirewallPorts.bat\"")
    {
        WindowStyle = ProcessWindowStyle.Hidden,
    };
    cmd.Start();

    // Uninstall EDM as service
    //var sc = new ServiceController("edm");
    //if (sc != null && sc.Status == ServiceControllerStatus.Running)
    //{
    //    sc.Stop();
    //}
    cmd = new Process();
    cmd.StartInfo = new ProcessStartInfo("cmd.exe", $"/C sc stop {_serviceName}")
    {
        WindowStyle = ProcessWindowStyle.Hidden,
    };
    cmd.Start();

    // Wait to give time to stop service
    cmd.WaitForExit();
    cmd = new Process();
    cmd.StartInfo = new ProcessStartInfo("cmd.exe",
        $"/C sc delete edm")
    {
        WindowStyle = ProcessWindowStyle.Hidden
    };
    cmd.Start();
}
