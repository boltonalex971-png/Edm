using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace Optosense.Edm.WebApi.Utils
{
    public class OperationHub : Hub
    {
        public async Task SendMessage(string user, string message)
        {
            await Clients.All.SendAsync("ReceiveMessage", user, message);
        }
    }
}
