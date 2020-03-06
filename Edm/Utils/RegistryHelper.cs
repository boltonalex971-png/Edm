using System;
using System.Collections.Generic;
using System.Linq;
using System.Configuration;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Win32;

namespace Microprojects.Edm.Utils
{
    public static class RegistryHelper
    {
        public static readonly string ApplicationRegistryPathKey = "ApplicationRegistryPath";
        public static readonly string ConnectionStringKey = "ConnectionString";

        private static string CompanyName
        {
            get
            {
                var companyAttribute = (AssemblyCompanyAttribute)GetCustomAttributeFromExecutingAssembly(typeof(AssemblyCompanyAttribute));
                if (companyAttribute != null)
                {
                    return companyAttribute.Company;
                }

                // If no Product attribute defined use "Acme"
                return "Acme";
            }
        }

        private static string ProductName
        {
            get
            {
                var productAttribute = (AssemblyProductAttribute)GetCustomAttributeFromExecutingAssembly(typeof(AssemblyProductAttribute));
                if (productAttribute != null)
                {
                    return productAttribute.Product;
                }

                // If no Product attribute defined used "Foobar"
                return "Foobar";
            }
        }

        #region Registry related stuff

        public static string GetBaseRegistryPath(SettingsContext context = null)
        {
            string applicationRegistryPath = null;
            if (context?.Contains(ApplicationRegistryPathKey) ?? false)
            {
                applicationRegistryPath = context[ApplicationRegistryPathKey] as string;
            }

            return applicationRegistryPath ?? string.Format(@"SOFTWARE\{0}\{1}", CompanyName, ProductName);
        }

        /// <summary>
        /// Return Current User base registry key
        /// <remarks>
        /// Do not forget to dispose returned value
        /// </remarks>
        /// </summary>
        /// <returns></returns>
        private static RegistryKey GetCurrentUserBaseKey(string hostName = null)
        {
            if (hostName == null)
            {
                return RegistryKey.OpenBaseKey(RegistryHive.CurrentUser,
                    Environment.Is64BitOperatingSystem ? RegistryView.Registry64 : RegistryView.Registry32);
            }
            else
            {
                return RegistryKey.OpenRemoteBaseKey(RegistryHive.CurrentUser, hostName);
            }
        }

        /// <summary>
        /// Return LocalMachine base registry key
        /// <remarks>
        /// Do not forget to dispose returned value
        /// </remarks>
        /// </summary>
        /// <returns></returns>
        private static RegistryKey GetLocalMachineBaseKey(string hostName = null)
        {
            if (hostName == null)
            {
                return RegistryKey.OpenBaseKey(RegistryHive.LocalMachine, RegistryView.Registry32);
                    //Environment.Is64BitOperatingSystem ? RegistryView.Registry64 : RegistryView.Registry32);
            }
            else
            {
                return RegistryKey.OpenRemoteBaseKey(RegistryHive.LocalMachine, hostName, RegistryView.Registry32);
            }
        }

        /// <summary>
        /// Saves setting into property
        /// Could be saved only User properties
        /// </summary>
        /// <param name="settingBaseRegistryPath">setting base registry path</param>
        /// <param name="keyName">key name</param>
        /// <param name="keyValue">key value</param>
        public static void SetSettingToRegistry(string settingBaseRegistryPath, string keyName, string keyValue, bool localMachine = false, string hostName = null)
        {
            // Only into HKCU save could be performed
            using (var baseKey = localMachine ? GetLocalMachineBaseKey(hostName) : GetCurrentUserBaseKey(hostName))
            // TODO: Version specific handling
            using (var applicationSubKey = baseKey.CreateSubKey(settingBaseRegistryPath))
            {
                if (applicationSubKey != null)
                {
                    applicationSubKey.SetValue(keyName, keyValue);    
                }
            }
        }

        public static void SetSettingsToRegistry(string settingSubKey, Dictionary<string, string> settings, bool localMachine = true, string hostName = null)
        {
            // Only into HKCU save could be performed
            using (var baseKey = localMachine ? GetLocalMachineBaseKey(hostName) : GetCurrentUserBaseKey(hostName))
            // TODO: Version specific handling
            using (var applicationSubKey = baseKey.CreateSubKey($"{GetBaseRegistryPath()}\\{settingSubKey ?? string.Empty}"))
            {
                if (applicationSubKey != null)
                {
                    foreach (var entry in settings)
                    {
                        applicationSubKey.SetValue(entry.Key, entry.Value);
                    }
                }
            }
        }

        /// <summary>
        /// Saves setting into property
        /// Could be saved only User properties
        /// </summary>
        /// <param name="settingBaseRegistryPath">setting base registry path</param>
        /// <param name="settingName"></param>
        /// <param name="fromLocalMachine"></param>
        public static string GetSettingFromRegistry(string settingBaseRegistryPath, string settingName, bool fromLocalMachine = true, string hostName = null)
        {
            string value = null;
            using (var currentUserBaseKey = fromLocalMachine ? GetLocalMachineBaseKey(hostName) : GetCurrentUserBaseKey(hostName))
            using (var applicationSubKey = currentUserBaseKey.OpenSubKey(settingBaseRegistryPath))
            {
                if (applicationSubKey != null)
                {
                    value = (string) applicationSubKey.GetValue(settingName);
                }
            }

            return value;
        }

        public static Dictionary<string, string> GetSettingsFromRegistry(string settingBaseRegistryPath, bool fromLocalMachine = true, string hostName = null)
        {
            var value = new Dictionary<string, string>();
            using (var currentUserBaseKey = fromLocalMachine ? GetLocalMachineBaseKey(hostName) : GetCurrentUserBaseKey(hostName))
            using (var applicationSubKey = currentUserBaseKey.OpenSubKey(settingBaseRegistryPath))
            {
                if (applicationSubKey != null)
                {
                    //value = (string)applicationSubKey.GetValue(settingName);
                    var names = applicationSubKey.GetValueNames();
                    foreach (var name in names)
                    {
                        value.Add(name, applicationSubKey.GetValue(name).ToString());
                    }
                }
            }

            return value;
        }

        public static Dictionary<string, string> GetAppSettings(string key = "", string hostName = null)
        {
            return GetSettingsFromRegistry($"{GetBaseRegistryPath()}\\{key}", fromLocalMachine: true, hostName: hostName);
        }

        public static string GetAppSetting(string key, string hostName = null)
        {
            return GetSettingFromRegistry(GetBaseRegistryPath(), key, true, hostName);
        }

        public static string GetCommandSetting(string hostName, ICommand command, string key)
        {
            return GetSettingFromRegistry(GetCommandBasePath(command), key, true, hostName);
        }

        public static string GetCommandSetting(this ICommand command, string setting)
        {
            return GetSettingFromRegistry(GetCommandBasePath(command), setting);
        }
        public static string GetCommandSetting(string commandName, string setting)
        {
            return GetSettingFromRegistry(GetCommandBasePath(commandName), setting);
        }

        public static void SetCommandSetting(string hostName, ICommand command, string key, string value)
        {
            SetSettingToRegistry(GetCommandBasePath(command), key, value, true, hostName);
        }

        public static Dictionary<string, string> GetListFromRegistry(string hostName, string path, string key)
        {
            var result = new Dictionary<string, string>();
            using (var baseKey = GetLocalMachineBaseKey(hostName))
            using (var appSubKey = baseKey.OpenSubKey($"{path}\\{key}"))
            {
                if (appSubKey != null)
                {
                    foreach (var item in appSubKey.GetValueNames())
                    {
                        result.Add(item, appSubKey.GetValue(item).ToString());
                    }
                }
            }
            return result;
        }

        public static void SetListToRegistry(string hostName, string path, string key, Dictionary<string, string> values)
        {
            using (var baseKey = GetLocalMachineBaseKey(hostName))
            {
                DeleteListFromRegistry(hostName, path, key);
                using (var appSubKey = baseKey.CreateSubKey($"{path}\\{key}"))
                {
                    foreach (var item in values)
                    {
                        appSubKey.SetValue(item.Key, item.Value);
                    }
                }
            }
        }

        public static void DeleteListFromRegistry(string hostName, string path, string key)
        {
            using (var baseKey = GetLocalMachineBaseKey(hostName))
            {
                if (baseKey.OpenSubKey($"{path}\\{key}") != null)
                {
                    baseKey.DeleteSubKeyTree($"{path}\\{key}");
                }
            }
        }

        #endregion End of Registry related stuff

        private static string GetCommandBasePath(ICommand command)
        {
            return GetCommandBasePath(command.Name);
        }
        private static string GetCommandBasePath(string commandName)
        {
            return $"{GetBaseRegistryPath()}\\{commandName}\\";
        }

        private static Attribute GetCustomAttributeFromExecutingAssembly(Type attributeType)
        {
            var assembly = Assembly.GetExecutingAssembly();
            return Attribute.GetCustomAttribute(assembly, attributeType);
        }


    }
}
