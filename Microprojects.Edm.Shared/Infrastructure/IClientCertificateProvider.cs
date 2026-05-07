using System.Security.Cryptography.X509Certificates;

namespace Microprojects.Edm.Infrastructure
{
    // Loads and exposes the client certificate used for outbound mutual-TLS:
    //  - SignalR self-subscriptions (EdmIntercom)
    //  - gRPC calls into peer EDM hosts (GrpcJobExecutor)
    // Both transports use the same cert so the receiver's RemoteServices
    // allow-list sees a single CN regardless of how the call arrived.
    public interface IClientCertificateProvider
    {
        // Null when no cert is configured or the configured subject was not
        // found in LocalMachine\My; callers should fall back to anonymous.
        X509Certificate2 Get();
    }
}
