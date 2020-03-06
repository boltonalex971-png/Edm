using System;
using System.Collections.Generic;

namespace Microprojects.Edm.Commands
{
    [Command(Name = "Stop", Lifetime = CommandType.ShortRunning)]
    public class StopCommand : BaseCommand
    {
        private ICommand Command { get; }

        public StopCommand(ICommand command)
        {
            Command = command;
        }

        public override Dictionary<string, object> GetParameters()
        {
            var p = base.GetParameters();
            p.Add("Command", Command.Name);
            return p;
        }
    }
}
