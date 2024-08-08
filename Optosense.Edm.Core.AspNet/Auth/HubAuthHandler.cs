using Microsoft.AspNetCore.Authorization;
using System.Threading.Tasks;

namespace Optosense.Edm.Core.AspNet.Auth
{
    public class HubAuthHandler : IAuthorizationHandler
    {
        Task IAuthorizationHandler.HandleAsync(AuthorizationHandlerContext context)
        {
            var c = context;
            return Task.CompletedTask;
        }
    }
}
