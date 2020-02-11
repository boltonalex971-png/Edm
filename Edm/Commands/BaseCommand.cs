using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microprojects.Edm;
using Microprojects.Edm.Log;
using Microprojects.Edm.Utils;
using Testcalibur.Utils;

namespace Microprojects.Edm.Commands
{
    public class BaseCommand : ICommand
    {
        public virtual string Name
        {
            get
            {
                var name = GetType().Name.Replace("Command", string.Empty);
                return name;
            }
        }
        protected CancellationToken CancellationToken { get; set; } = CancellationToken.None;

        public virtual bool Init()
        {
            return true;
        }

        public virtual async Task<object> ExecuteAsync()
        {
            return await Task.FromResult("Ok");
        }

        public virtual async Task<object> ExecuteAsync(CancellationToken cancellationToken)
        {
            CancellationToken = cancellationToken;
            return await ExecuteAsync();
        }

        public virtual Params GetParameters()
        {
            var result = new List<string>();
            var props = GetType().GetProperties()
                .Where(p => p.GetCustomAttributes(typeof(CommandParameterAttribute), false).Count() == 1);
            foreach (var prop in props)
            {
                var attr = prop.GetCustomAttribute<CommandParameterAttribute>(false);
                var propName = attr.Name ?? prop.Name;
                string propValue = null;
                if (prop.GetValue(this) != null)
                {
                    if (prop.PropertyType.GetInterfaces().Contains(typeof(IEnumerable<int>)))
                    {
                        var arr = (IEnumerable<int>)prop.GetValue(this);
                        propValue = $"[{string.Join(", ", arr)}]";
                    }
                    else
                    {
                        propValue = $"\"{prop.GetValue(this)}\"";
                    }
                    result.Add($"\"{propName}\":{propValue}");
                }
            }
            return JsonHelper.ToParams(string.Join(", ", result));
        }

        public void SetParameters(Params data)
        {
            var props = GetType().GetProperties()
                .Where(p => p.GetCustomAttributes(typeof(CommandParameterAttribute), false).Count() == 1);

            if (data == null)
            {
                data = new Params();
            }

            string errors = string.Empty;

            foreach (var prop in props)
            {
                var attr = prop.GetCustomAttribute<CommandParameterAttribute>(false);
                var propName = attr.Name ?? prop.Name;
                // TODO Cannot store arrays in Registry, needs to convert string to array first
                var newValue = data.ContainsKey(propName) ? data[propName] : 
                    this.GetCommandSetting(propName) ?? (RuntimeInformation.IsOSPlatform(OSPlatform.Windows) ? RegistryHelper.GetAppSetting(propName) : default);
                if (newValue != null)
                {
                    if (prop.PropertyType == typeof(bool?) || prop.PropertyType == typeof(bool))
                    {
                        if (bool.TryParse((string) newValue, out bool value))
                        {
                            prop.SetValue(this, (bool?) value);
                        }
                        else
                        {
                            errors += $"Parameter '{propName}' must be boolean (TRUE or FALSE)\r\n";
                        }
                    }
                    else if (prop.PropertyType == typeof(int?) || prop.PropertyType == typeof(int))
                    {
                        if (int.TryParse((string) newValue, out int value))
                        {
                            prop.SetValue(this, (int?) value);
                        }
                        else
                        {
                            errors += $"Parameter '{propName}' must be integer\r\n";
                        }
                    }
                    else if (prop.PropertyType == typeof(int[]))
                    {
                        if (newValue.GetType() != typeof(object[]))
                        {
                            errors += $"Parameter '{propName}' must be an array\r\n";
                        }
                        try
                        {
                            prop.SetValue(this, ((object[])newValue).Cast<int>().ToArray());
                        }
                        catch (InvalidCastException)
                        {
                            errors += $"Parameter '{propName}' must be an array of integers\r\n";
                        }
                    }
                    else
                    {
                        prop.SetValue(this, newValue);
                    }
                }
                else if (attr.Required)
                {
                    //throw new ArgumentException($"Parameter '{prop.Name}' is required");
                    errors += $"Parameter '{propName}' is required\r\n";
                }
            }
            if (!string.IsNullOrEmpty(errors))
            {
                throw new ArgumentException($"\r\n{errors}");
            }
        }
    }

    [AttributeUsage(AttributeTargets.Property, AllowMultiple = false)]
    public class CommandParameterAttribute : Attribute
    {
        public string Name { get; set; }
        public bool Required { get; set; } = false;

    }
}