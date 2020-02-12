using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace Microprojects.Edm
{
    public interface ICommand
    {
        string Name { get; }
        Task<object> ExecuteAsync();
        Task<object> ExecuteAsync(CancellationToken cancellationToken);
        Dictionary<string, object> GetParameters();
        void SetParameters(string data);
        bool Init();
    }

    public interface ICommandParameters
    {
    }

    public enum CommandType
    {
        Permanent,
        LongRunning,
        ShortRunning
    }

    [AttributeUsage(AttributeTargets.Class)]
    public class CommandAttribute : Attribute
    {
        public string Name { get; set; }
        public CommandType Lifetime { get; set; }
        public Type Parameters { get; set; }
    }

}
