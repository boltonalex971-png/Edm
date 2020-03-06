using System;
using System.Collections.Generic;

namespace Microprojects.Edm.Commands
{
    [Command(Name = "Check", Lifetime = CommandType.ShortRunning)]
    public class CheckCommand : BaseCommand
    {
        private ICommand Command { get; }

        public CheckCommand(ICommand command)
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
