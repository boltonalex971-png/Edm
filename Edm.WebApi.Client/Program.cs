using System;
using System.Net.Http;
using System.Threading.Tasks;
using Grpc.Net.Client;
using Edm.WebApi;

namespace Edm.WebApi.Client
{
    class Program
    {
        static async Task Main(string[] args)
        {
            // The port number(5001) must match the port of the gRPC server.
            var channel = GrpcChannel.ForAddress("https://localhost:5001");
            var client = new CommandExecutor.CommandExecutorClient(channel);
            var tasks = await client.GetAvailableTasksAsync(new AvalableTaskParams());
            foreach (var t in tasks.Tasks)
            {
                Console.WriteLine($"{t.TaskName} ({t.Type}) -> {t.Status}");
            }
            var reply = await client.ExecuteCommandAsync(
                              new CommandParams { Command = "Test", Params = "{\"CacheConnectionString\": \"qqq\"}" });
            Console.WriteLine($"Response: {reply.Status} {reply.Message} {reply.Response}");
            Console.WriteLine("Press any key to exit...");
            Console.ReadKey();
        }
    }
}