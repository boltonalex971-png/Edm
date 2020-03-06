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
using Newtonsoft.Json;
using Testcalibur.Utils;

namespace Microprojects.Edm.Commands
{
    public class BaseCommand : ICommand
    {
        protected ICommandParameters CommandParameters { get; set; }

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

        public virtual Dictionary<string, object> GetParameters()
        {
            var paramStr = JsonConvert.SerializeObject((object)CommandParameters ?? this);
            return JsonConvert.DeserializeObject<Dictionary<string, object>>(paramStr);
        }

        public void SetParameters(string data)
        {
            data = data ?? "{}";
            var commandParamsType = GetType().GetCustomAttribute<CommandAttribute>(true)?.Parameters;
            if (commandParamsType != null)
            {
                var param = Activator.CreateInstance(commandParamsType);
                JsonConvert.PopulateObject(data, param);
                CommandParameters = param as ICommandParameters;
            }
            else
            {
                JsonConvert.PopulateObject(data, this);
            }
        }
    }

    public class CommandParameters : ICommandParameters
    {
        public string CacheConnectionString { get; set; }
        public int CacheDbNumber { get; set; }
    }

    [AttributeUsage(AttributeTargets.Property, AllowMultiple = false)]
    public class CommandParameterAttribute : Attribute
    {
        public string Name { get; set; }
        public bool Required { get; set; } = false;

    }
}
