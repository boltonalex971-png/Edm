using System;
using System.Net.Http;
using System.Threading.Tasks;
using Grpc.Net.Client;
using Newtonsoft.Json;
using Optosense.Edm.Commands;
using Optosense.Edm.Infrastructure.Protos;

namespace Edm.WebApi.Client
{
    class Program
    {
        static async Task Main(string[] args)
        {
            //AppContext.SetSwitch("System.Net.Http.SocketsHttpHandler.Http2UnencryptedSupport", true);
            // The port number(5001) must match the port of the gRPC server.
            var channel = GrpcChannel.ForAddress("https://localhost:16334");
            var client = new CommandExecutor.CommandExecutorClient(channel);
            var tasks = await client.GetAvailableTasksAsync(new AvalableTaskParams());
            foreach (var t in tasks.Tasks)
            {
                Console.WriteLine($"{t.TaskName} ({t.Type}) -> {t.Status}");
            }
            //var reply = await client.ExecuteCommandAsync(
            //                  new CommandParams
            //                  {
            //                      Command = "StartDevice",
            //                      Params = $@"{{
            //                        Device: ""NullGas"",
            //                        DriverOptions: {{}},
            //                        Profile: [
            //                            {{Order:  0, Offset: 1000, Operation: ""Start""}},
            //                            {{Order: 10, Offset: 2000, Operation: ""Set 10""}},
            //                            {{Order: 20, Offset: 2000, Operation: ""Ping""}},
            //                            {{Order: 30, Offset: 3000, Operation: ""Set 50""}},
            //                            {{Order: 40, Offset: 2000, Operation: ""Ping""}},
            //                            {{Order: 50, Offset: 3000, Operation: ""Stop""}}
            //                        ]}}"
            //                  });


            //var parameters = new StartOperationCommandParameters {
            //    DbConnectionString = @"Data Source=.\SQLEXPRESS;MultipleActiveResultSets=true;Initial Catalog=optosense_edm;Integrated Security=SSPI;",
            //    Operation = 1,
            //    StartAt = DateTime.Now.AddSeconds(5)
            //};
            //var reply = await client.ExecuteCommandAsync(
            //                  new CommandParams
            //                  {
            //                      Command = "StartProcess",
            //                      Params = $@"{JsonConvert.SerializeObject(parameters)}"
            //                  });
            //Console.WriteLine($"Response: {reply.Status} {reply.Message} {reply.Response}");
            //Console.WriteLine("Press any key to exit...");
            //Console.ReadKey();
        }
    }
}