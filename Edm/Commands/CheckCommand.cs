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
            CommandParameters = command.CommandParameters;
        }

        public override Dictionary<string, object> GetParameters()
        {
            var p = Command.GetParameters();
            p.Add("Command", Command.Name);
            return p;
        }
    }
}
