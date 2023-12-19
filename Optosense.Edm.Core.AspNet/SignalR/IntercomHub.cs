using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace Optosense.Edm.WebApi.Utils
{
    public interface IOperationClient
    {
        Task Receive(object message);
    }

    public class IntercomHub : Hub<IOperationClient>
    {
        public static string Hub { get => "hub"; }
        public async Task Publish(string channel, object message)
        {
            await Clients.Group(channel).Receive(message);
        }

        public async Task Subscribe(string channel)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, channel);
        }

    }
}
