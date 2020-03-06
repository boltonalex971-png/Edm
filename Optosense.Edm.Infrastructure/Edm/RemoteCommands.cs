using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Grpc.Net.Client;
using Optosense.Edm.Domain.Infrastructure;
using Optosense.Edm.WebApi;

namespace Optosense.Edm.Infrastructure.Edm
{
    public class RemoteCommands : IRemoteCommands
    {
        public async Task<string> Execute(string host, string command, string parameters, DateTime startAt)
        {
            if (command == null || parameters == null)
            {
                throw new Exception("Command name and parameters cannot be null");
            }

            var channel = GrpcChannel.ForAddress(host);
            var client = new CommandExecutor.CommandExecutorClient(channel);
            var reply = await client.ExecuteCommandAsync(new CommandParams { Command = command, Params = parameters });
            return reply.Response;
        }
    }
}
