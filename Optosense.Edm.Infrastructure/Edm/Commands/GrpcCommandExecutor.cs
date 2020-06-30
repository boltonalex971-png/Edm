using Grpc.Net.Client;
using Microprojects.Edm;
using Newtonsoft.Json;
using Optosense.Edm.WebApi;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Infrastructure.Edm.Commands
{
    internal static class GrpcCommandExecutor
    {
        public static async Task<CommandResponse> RemoteExecute(this ICommand command, string host, object parameters = null)
        {
            if (command == null)
            {
                throw new Exception("Command cannot be null");
            }

            using (var channel = GrpcChannel.ForAddress(host))
            {
                var client = new CommandExecutor.CommandExecutorClient(channel); 
                var response = await client.ExecuteCommandAsync(new CommandParams 
                { 
                    Command = command.Name, 
                    Params = JsonConvert.SerializeObject(parameters ?? command.CommandParameters) 
                });
                return response;
            }
        }
    }
}
