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
        Params GetParameters();
        void SetParameters(Params data);
        bool Init();
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
    }

}
