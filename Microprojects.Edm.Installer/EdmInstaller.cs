using System;
using System.Collections;
using System.Collections.Generic;
using System.ComponentModel;
using System.Configuration.Install;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.ServiceProcess;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace Microprojects.Edm.Installer
{
    [RunInstaller(true)]
    public partial class EdmInstaller : System.Configuration.Install.Installer
    {
        private bool _installRedis = false;
        private bool _versionNT64 = false;
        private int _versionNT;
        private string _targetDir;

        public EdmInstaller()
        {
            InitializeComponent();
        }

        [System.Security.Permissions.SecurityPermission(System.Security.Permissions.SecurityAction.Demand)]
        protected override void OnAfterInstall(IDictionary savedState)
        {
#if DEBUG
            System.Diagnostics.Debugger.Launch();
#endif
            base.OnAfterInstall(savedState);

            _versionNT = int.Parse(Context.Parameters["versionnt"] ??
                $"{System.Environment.Version.Major}0{System.Environment.Version.Minor}");
            _versionNT64 = System.Environment.Is64BitOperatingSystem;
            _installRedis = Context.Parameters["installredis"] == "1";
            _targetDir = Context.Parameters["targetdir"];

            var cmd = new Process();
            // Open firewall ports
            cmd.StartInfo = new ProcessStartInfo("cmd.exe", $"/C {_targetDir}OpenFirewallPorts.bat") 
            { 
                WindowStyle = ProcessWindowStyle.Hidden
            };
            cmd.Start();

            // Fix appsettings.json according choosen installation options
            var settingsPath = $"{_targetDir}\\appsettings.json";
            var settings = File.ReadAllText(settingsPath);
            settings = settings.Replace("[CACHECONNECTIONSTRING]", Context.Parameters["cache"].ToString());
            settings = settings.Replace("[DBCONNECTIONSTRING]", Context.Parameters["db"].ToString().Replace("\\", "\\\\"));
            settings = settings.Replace("[CONSOLEURL]", Context.Parameters["consoleUrl"].ToString());
            settings = settings.Replace("[GRPCURL]", Context.Parameters["grpcUrl"].ToString());
            File.WriteAllText(settingsPath, settings);
            File.Delete($"{_targetDir}\\appsettings.Production.json");
            File.Delete($"{_targetDir}\\appsettings.Development.json");

            // Install EDM as service
            cmd.StartInfo = new ProcessStartInfo("cmd.exe", 
                $"/C sc create edm start= auto DisplayName= \"EDM Service\" binPath= \"{_targetDir}Optosense.Edm.WebApi.exe\"")
            {
                WindowStyle = ProcessWindowStyle.Hidden,
            };
            cmd.Start();

            // Wait to give time to start service
            Task.Delay(1000).Wait();

            var sc = new ServiceController("edm");
            if (sc != null && sc.Status == ServiceControllerStatus.Stopped)
            {
                sc.Start();
            }
        }

        [System.Security.Permissions.SecurityPermission(System.Security.Permissions.SecurityAction.Demand)]
        protected override void OnBeforeUninstall(IDictionary savedState)
        {
#if DEBUG
            System.Diagnostics.Debugger.Launch();
#endif
            base.OnBeforeUninstall(savedState);

            _targetDir = Context.Parameters["targetdir"];

            var cmd = new Process();
            // Close firewall ports
            cmd.StartInfo = new ProcessStartInfo("cmd.exe", $"/C {_targetDir}CloseFirewallPorts.bat")
            {
                WindowStyle = ProcessWindowStyle.Hidden
            };
            cmd.Start();

            // Uninstall EDM as service
            var sc = new ServiceController("edm");
            if (sc != null && sc.Status == ServiceControllerStatus.Running)
            {
                sc.Stop();
            }

            // Wait to give time to stop service
            Task.Delay(1000).Wait();

            cmd.StartInfo = new ProcessStartInfo("cmd.exe",
                $"/C sc delete edm")
            {
                WindowStyle = ProcessWindowStyle.Hidden
            };
            cmd.Start();
        }
    }
}
