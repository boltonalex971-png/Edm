using System;
using System.Security.Cryptography.X509Certificates;
using Microprojects.Edm.Utils;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microprojects.Edm.Infrastructure;

namespace Microprojects.Edm.Host.Auth
{
    public class ClientCertificateProvider : IClientCertificateProvider
    {
        private readonly X509Certificate2 _certificate;

        public ClientCertificateProvider(IConfiguration configuration, ILogger<ClientCertificateProvider> logger)
        {
            var subject = configuration["Edm:Intercom:ClientCertificateSubject"]
                          ?? configuration["Kestrel:Certificates:Default:Subject"];
            _certificate = Load(subject, logger);
        }

        public X509Certificate2 Get() => _certificate;

        private static X509Certificate2 Load(string subject, ILogger logger)
        {
            if (string.IsNullOrEmpty(subject))
            {
                logger?.LogInformation("No ClientCertificateSubject configured; outbound mutual-TLS will be cert-less.");
                return null;
            }
            try
            {
                using var store = new X509Store(StoreName.My, StoreLocation.LocalMachine);
                store.Open(OpenFlags.ReadOnly);
                var found = store.Certificates.Find(X509FindType.FindBySubjectName, subject, validOnly: false);
                if (found.Count == 0)
                {
                    logger?.LogWarning("Client cert not found in LocalMachine\\My by subject '{Subject}'; outbound mutual-TLS will be cert-less.", subject);
                    return null;
                }
                logger?.LogInformation("Client cert loaded: subject='{Subject}', thumbprint={Thumbprint}", found[0].Subject, found[0].Thumbprint);
                return found[0];
            }
            catch (Exception ex)
            {
                logger?.LogError("Failed to load client cert by subject '{Subject}': {Reason}", subject, ex.GetMeaningfulMessage());
                return null;
            }
        }
    }
}
