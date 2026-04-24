using System.Diagnostics;
using System.Net;
using Microsoft.Win32;
//System.Diagnostics.Debugger.Launch();
var stage = args[0];
var options = args[1..]
    .Select(a => a.Split('=', 2))
    .ToDictionary(a => a[0][1..], a => a.Length == 2 ? a[1] : null);
Console.WriteLine(string.Join(", ", options.Select(o => $"{o.Key}={MaskConnectionLike(o.Key, o.Value)}")));

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

    // Fix appsettings.json. Connection strings are no longer substituted here:
    // the service reads them as env vars at startup via the per-service
    // Environment registry key written below.
    var settingsPath = $"{_targetDir}\\appsettings.json";
    var settings = File.ReadAllText(settingsPath);
    settings = settings.Replace("[PRINCIPALURL]", options["principalUrl"]);
    settings = settings.Replace("[CONSOLEURL]", $"{protocol}://{hostName}:{consolePort}");
    settings = settings.Replace("[GRPCURL]", $"{protocol}://{hostName}:{grpcPort}");
    settings = settings.Replace("[HOSTNAME]", hostName);
    settings = settings.Replace("[MODE]", options["mode"]);
    File.WriteAllText(settingsPath, settings);
    File.Delete($"{_targetDir}\\appsettings.Production.json");
    File.Delete($"{_targetDir}\\appsettings.Development.json");

    // Register the service first so HKLM\SYSTEM\CurrentControlSet\Services\edm
    // exists when we go to write its Environment value below.
    cmd = new Process();
    cmd.StartInfo = new ProcessStartInfo("cmd.exe",
        $"/C sc create {_serviceName} start= auto DisplayName= \"EDM Service\" binPath= \"{_targetDir}Optosense.Edm.WebApi.exe\"")
    {
        WindowStyle = ProcessWindowStyle.Hidden,
    };
    cmd.Start();
    cmd.WaitForExit();

    // Restore any Environment backup stashed by a prior Uninstall. MSI major
    // upgrades run Uninstall→Install in the same session; `sc delete` wipes
    // the service's Environment, so without this step every upgrade would
    // force the admin to re-supply DBCONNECTIONSTRING.
    RestoreServiceEnvFromBackup(_serviceName);

    // Resolve each connection string. Precedence: existing registry value
    // (upgrade case or restored backup) → MSI property (first install) → fail.
    var dbConn = ResolveConnectionString(_serviceName, "ConnectionStrings__Edm", options, "db");
    var logisticsConn = ResolveConnectionString(_serviceName, "ConnectionStrings__Logistics", options, "logisticsDb");

    if (string.IsNullOrEmpty(dbConn))
    {
        throw new InvalidOperationException(
            "No DB connection string available. First install must provide DBCONNECTIONSTRING via msiexec, "
            + $"or set HKLM\\SYSTEM\\CurrentControlSet\\Services\\{_serviceName}\\Environment "
            + "with a ConnectionStrings__Edm=... entry.");
    }
    if (string.IsNullOrEmpty(logisticsConn))
    {
        // Typical single-server deployment: derive Logistics from /db by
        // swapping "optosense_edm" → "optosense_logistics". Write the derived
        // value back to the registry so upgrades skip this step.
        logisticsConn = dbConn.Contains("optosense_edm", StringComparison.OrdinalIgnoreCase)
            ? dbConn.Replace("optosense_edm", "optosense_logistics", StringComparison.OrdinalIgnoreCase)
            : dbConn;
        WriteServiceEnv(_serviceName, "ConnectionStrings__Logistics", logisticsConn);
        Console.WriteLine("Derived ConnectionStrings__Logistics from /db (catalog swap).");
    }

    // Apply EF migrations before the service starts touching the DB.
    Migrate($"{_targetDir}Optosense.Edm.DataAccess.efbundle.exe", dbConn);
    Migrate($"{_targetDir}Microprojects.Edm.Ui.Logistics.efbundle.exe", logisticsConn);

    // Backup existed only to bridge an upgrade; service Environment is now
    // populated, so drop it. No-op on a first install.
    DeleteEnvBackup();

    cmd = new Process();
    cmd.StartInfo = new ProcessStartInfo("cmd.exe", $"/C sc start {_serviceName}")
    {
        WindowStyle = ProcessWindowStyle.Hidden,
    };
    cmd.Start();
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

    // Only stash the service Environment if this Uninstall is the first half
    // of a major upgrade; for a plain user-initiated uninstall, wipe any
    // leftover backup so the machine is left clean. MSI sets
    // UPGRADINGPRODUCTCODE to the old product GUID during an upgrade's
    // uninstall phase; the vdproj forwards it as /upgrading=... .
    var isUpgrade = options.TryGetValue("upgrading", out var upgradeCode)
        && !string.IsNullOrWhiteSpace(upgradeCode)
        && !upgradeCode.StartsWith('[');
    if (isUpgrade)
    {
        BackupServiceEnv(_serviceName);
    }
    else
    {
        DeleteEnvBackup();
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

// Resolution order per connection string:
//   1. HKLM\SYSTEM\CurrentControlSet\Services\<svc>\Environment already has the key
//      → upgrade path, use it silently.
//   2. MSI property (e.g. DBCONNECTIONSTRING) is present and non-empty
//      → first install, promote to the registry and use it.
//   3. Neither → return null; caller turns it into a hard failure.
static string? ResolveConnectionString(string serviceName, string envKey,
    Dictionary<string, string?> options, string msiProperty)
{
    var existing = TryReadServiceEnv(serviceName, envKey);
    if (!string.IsNullOrWhiteSpace(existing))
    {
        Console.WriteLine($"Using existing {envKey} from service Environment.");
        return existing;
    }

    if (options.TryGetValue(msiProperty, out var fromMsi)
        && !string.IsNullOrWhiteSpace(fromMsi)
        && !fromMsi.StartsWith('['))
    {
        WriteServiceEnv(serviceName, envKey, fromMsi);
        Console.WriteLine($"Stored {envKey} in service Environment from MSI property /{msiProperty}.");
        return fromMsi;
    }

    return null;
}

// The Service Control Manager passes the REG_MULTI_SZ at
// HKLM\SYSTEM\CurrentControlSet\Services\<svc>\Environment as the service's
// process environment block on each service start. Each line is a KEY=VALUE
// pair; ASP.NET Core's default config builder turns ConnectionStrings__Foo
// entries into configuration.GetConnectionString("Foo").
static string? TryReadServiceEnv(string serviceName, string key)
{
    using var sub = Registry.LocalMachine.OpenSubKey(
        $@"SYSTEM\CurrentControlSet\Services\{serviceName}");
    if (sub?.GetValue("Environment") is not string[] lines)
    {
        return null;
    }
    var prefix = key + "=";
    return lines
        .FirstOrDefault(l => l.StartsWith(prefix, StringComparison.Ordinal))
        ?[prefix.Length..];
}

// Read the whole MULTI_SZ Environment of a service and copy it to a side
// location that survives `sc delete` during MSI major upgrades. No-op if the
// service doesn't exist or has no Environment values.
static void BackupServiceEnv(string serviceName)
{
    using var svc = Registry.LocalMachine.OpenSubKey(
        $@"SYSTEM\CurrentControlSet\Services\{serviceName}");
    if (svc?.GetValue("Environment") is not string[] lines || lines.Length == 0)
    {
        return;
    }
    using var backup = Registry.LocalMachine.CreateSubKey(
        @"SOFTWARE\Optosense\EDM", writable: true)!;
    backup.SetValue("EnvBackup", lines, RegistryValueKind.MultiString);
    Console.WriteLine($"Backed up {lines.Length} Environment entr(y|ies) for later restore.");
}

// Called right after `sc create`. If the just-created service has no
// Environment yet but a backup exists (typical major-upgrade case), copy it
// across. The backup is deleted once Install has finished successfully
// (see DeleteEnvBackup near the end of Install()).
static void RestoreServiceEnvFromBackup(string serviceName)
{
    using var svc = Registry.LocalMachine.OpenSubKey(
        $@"SYSTEM\CurrentControlSet\Services\{serviceName}", writable: true);
    if (svc is null) return;
    if (svc.GetValue("Environment") is string[] existing && existing.Length > 0)
    {
        return;
    }
    using var backup = Registry.LocalMachine.OpenSubKey(@"SOFTWARE\Optosense\EDM");
    if (backup?.GetValue("EnvBackup") is not string[] lines || lines.Length == 0)
    {
        return;
    }
    svc.SetValue("Environment", lines, RegistryValueKind.MultiString);
    Console.WriteLine($"Restored {lines.Length} Environment entr(y|ies) from backup.");
}

// Idempotent. Called at the end of a successful Install (backup consumed) and
// at the start of a non-upgrade Uninstall (clean tear-down).
static void DeleteEnvBackup()
{
    using var parent = Registry.LocalMachine.OpenSubKey(@"SOFTWARE\Optosense", writable: true);
    parent?.DeleteSubKeyTree("EDM", throwOnMissingSubKey: false);
}

static void WriteServiceEnv(string serviceName, string key, string value)
{
    using var sub = Registry.LocalMachine.OpenSubKey(
        $@"SYSTEM\CurrentControlSet\Services\{serviceName}", writable: true)
        ?? throw new InvalidOperationException(
            $"Service registry key missing for {serviceName}. Did `sc create` succeed?");
    var existing = sub.GetValue("Environment") as string[] ?? [];
    var prefix = key + "=";
    var kept = existing.Where(l => !l.StartsWith(prefix, StringComparison.Ordinal));
    var newLines = kept.Append($"{key}={value}").ToArray();
    sub.SetValue("Environment", newLines, RegistryValueKind.MultiString);
}

static void Migrate(string bundlePath, string connectionString)
{
    if (!File.Exists(bundlePath))
    {
        Console.WriteLine($"Migration bundle missing, skipping: {bundlePath}");
        return;
    }

    // Drop a per-bundle log next to the bundle so MSI admins can read it.
    // EF writes useful info to stdout (applied migrations, SQL errors) and
    // stderr interchangeably; merge both into one transcript.
    var logPath = Path.ChangeExtension(bundlePath, ".log");
    var sb = new System.Text.StringBuilder();
    sb.AppendLine($"=== {DateTime.Now:O} ===");
    sb.AppendLine($"Bundle: {bundlePath}");
    sb.AppendLine($"User: {Environment.UserDomainName}\\{Environment.UserName}");

    var psi = new ProcessStartInfo(bundlePath, $"--connection \"{connectionString}\"")
    {
        WindowStyle = ProcessWindowStyle.Hidden,
        RedirectStandardOutput = true,
        RedirectStandardError = true,
        UseShellExecute = false,
        CreateNoWindow = true,
    };
    var p = Process.Start(psi)!;
    // Event-driven read avoids the buffer-fill deadlock that ReadToEnd()
    // can produce when a child writes a lot before exiting.
    p.OutputDataReceived += (_, e) => { if (e.Data is not null) sb.AppendLine(e.Data); };
    p.ErrorDataReceived += (_, e) => { if (e.Data is not null) sb.AppendLine("[err] " + e.Data); };
    p.BeginOutputReadLine();
    p.BeginErrorReadLine();
    p.WaitForExit();

    sb.AppendLine($"Exit code: {p.ExitCode}");
    var transcript = sb.ToString();
    try
    {
        File.AppendAllText(logPath, transcript);
    }
    catch { /* best-effort; don't mask a real migration error with a log-write failure */ }

    Console.WriteLine(transcript);
    if (p.ExitCode != 0)
    {
        throw new InvalidOperationException(
            $"Migration failed for {Path.GetFileName(bundlePath)} (exit {p.ExitCode}). "
            + $"See {logPath} for full output. Transcript:\n{transcript}");
    }
}

// Don't echo connection-string values to MSI logs on startup. Other options
// (targetDir, mode, etc.) remain unredacted.
static string? MaskConnectionLike(string name, string? value)
    => name.IndexOf("db", StringComparison.OrdinalIgnoreCase) >= 0 && !string.IsNullOrEmpty(value)
        ? "***"
        : value;
