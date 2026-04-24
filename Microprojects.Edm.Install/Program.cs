using System.Diagnostics;
using System.Net;
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

    // Define DNS name of target host
    var protocol = "https";
    var hostName = Dns.GetHostEntry(Dns.GetHostName()).HostName;
    var consolePort = 16332;
    var grpcPort = 16334;

    // Resolve connection strings. /logisticsDb is optional: when missing or
    // left as a literal MSI placeholder, derive it from /db by swapping the
    // catalog name (typical single-server deployment).
    var dbConn = options["db"];
    var logisticsConn = ResolveLogisticsConnection(options, dbConn);

    // Fix appsettings.json according choosen installation options
    var settingsPath = $"{_targetDir}\\appsettings.json";
    var settings = File.ReadAllText(settingsPath);
    //settings = settings.Replace("[CACHECONNECTIONSTRING]", options["cache"]);
    settings = settings.Replace("[DBCONNECTIONSTRING]", dbConn?.Replace("\\", "\\\\"));
    settings = settings.Replace("[LOGISTICSCONNECTIONSTRING]", logisticsConn?.Replace("\\", "\\\\"));
    settings = settings.Replace("[PRINCIPALURL]", options["principalUrl"]);
    settings = settings.Replace("[CONSOLEURL]", $"{protocol}://{hostName}:{consolePort}"); //options["consoleUrl"]);
    settings = settings.Replace("[GRPCURL]", $"{protocol}://{hostName}:{grpcPort}"); //options["grpcUrl"]);
    settings = settings.Replace("[HOSTNAME]", hostName); //options["mode"]);
    settings = settings.Replace("[MODE]", options["mode"]);
    File.WriteAllText(settingsPath, settings);
    File.Delete($"{_targetDir}\\appsettings.Production.json");
    File.Delete($"{_targetDir}\\appsettings.Development.json");

    // Apply EF migrations before the service starts touching the DB. Each
    // bundle is a self-contained migrator that compares __EFMigrationsHistory
    // against the migrations baked into it and applies only the missing ones.
    if (!string.IsNullOrEmpty(dbConn))
    {
        Migrate($"{_targetDir}Optosense.Edm.DataAccess.efbundle.exe", dbConn);
    }
    if (!string.IsNullOrEmpty(logisticsConn))
    {
        Migrate($"{_targetDir}Microprojects.Edm.Ui.Logistics.efbundle.exe", logisticsConn);
    }

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
    if (!options.TryGetValue("targetDir", out var _targetDir))
    {
        // Upgrading from a version whose MSI passed no arguments — derive path from service registry
        var imagePath = Microsoft.Win32.Registry.GetValue(
            @"HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\edm", "ImagePath", null) as string;
        _targetDir = imagePath is not null ? Path.GetDirectoryName(imagePath) + @"\" : null;
    }

    var cmd = new Process();
    // Close firewall ports
    if (_targetDir is not null && File.Exists($"{_targetDir}CloseFirewallPorts.bat"))
    {
        cmd.StartInfo = new ProcessStartInfo("cmd.exe", $"/C \"{_targetDir}CloseFirewallPorts.bat\"")
        {
            WindowStyle = ProcessWindowStyle.Hidden,
        };
        cmd.Start();
    }

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

static string? ResolveLogisticsConnection(Dictionary<string, string?> options, string? dbConn)
{
    if (options.TryGetValue("logisticsDb", out var explicitConn)
        && !string.IsNullOrWhiteSpace(explicitConn)
        && !explicitConn.StartsWith('['))
    {
        return explicitConn;
    }

    if (string.IsNullOrEmpty(dbConn))
    {
        return null;
    }

    // Same server, swap catalog. Match the typical "optosense_edm" → "optosense_logistics"
    // pairing; if the catalog already mentions logistics, leave it alone.
    const string fromCatalog = "optosense_edm";
    const string toCatalog = "optosense_logistics";
    if (dbConn.Contains(fromCatalog, StringComparison.OrdinalIgnoreCase))
    {
        return dbConn.Replace(fromCatalog, toCatalog, StringComparison.OrdinalIgnoreCase);
    }
    return dbConn;
}

static void Migrate(string bundlePath, string connectionString)
{
    if (!File.Exists(bundlePath))
    {
        Console.WriteLine($"Migration bundle missing, skipping: {bundlePath}");
        return;
    }

    var psi = new ProcessStartInfo(bundlePath, $"--connection \"{connectionString}\"")
    {
        WindowStyle = ProcessWindowStyle.Hidden,
        RedirectStandardOutput = true,
        RedirectStandardError = true,
        UseShellExecute = false,
        CreateNoWindow = true,
    };
    var p = Process.Start(psi)!;
    var stdout = p.StandardOutput.ReadToEnd();
    var stderr = p.StandardError.ReadToEnd();
    p.WaitForExit();

    Console.WriteLine(stdout);
    if (p.ExitCode != 0)
    {
        throw new InvalidOperationException(
            $"Migration failed for {Path.GetFileName(bundlePath)} (exit {p.ExitCode}):\n{stderr}");
    }
}
