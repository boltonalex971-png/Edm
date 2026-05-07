using Microsoft.AspNetCore.SignalR;
using System.Linq;
using System.Net;
using Microprojects.Edm.Auth;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Microprojects.Edm.Host.SignalR
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
            if (Context.User.Identity?.IsAuthenticated != true && !IsInternalConnection())
            {
                throw new HubException("Unauthorized");
            }
            await Groups.AddToGroupAsync(Context.ConnectionId, channel);
        }

        private bool IsInternalConnection()
        {
            if (Context.User.HasClaim(ClaimTypes.Role, AuthDefaults.RemoteService))
            {
                return true;
            }

            var httpContext = Context.GetHttpContext();
            if (httpContext == null) return false;
            return IPAddress.IsLoopback(httpContext.Connection.RemoteIpAddress);
        }

    }
}
