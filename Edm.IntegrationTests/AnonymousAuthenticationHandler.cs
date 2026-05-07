using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Edm.IntegrationTests;

// Always returns NoResult so the request stays anonymous. Used as the
// DefaultAuthenticateScheme + DefaultChallengeScheme in tests so we can
// avoid Negotiate (which requires Kestrel's IConnectionItemsFeature and
// crashes on TestServer). The base class's HandleChallengeAsync sets a
// 401 with no scheme-specific handshake — that's what we want for
// FallbackPolicy = RequireAuthenticatedUser hits.
public class AnonymousAuthenticationHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    public const string SchemeName = "TestAnonymous";

    public AnonymousAuthenticationHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder)
        : base(options, logger, encoder)
    {
    }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
        => Task.FromResult(AuthenticateResult.NoResult());
}
