using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Optosense.Edm.Domain.Infrastructure
{
    public interface IRemoteCommands 
    {
        Task<string> Execute(string host, string command, string parameters, DateTime startAt);
    }
}