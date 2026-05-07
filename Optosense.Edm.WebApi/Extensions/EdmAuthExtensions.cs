using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Security.Principal;
using System.Text;
using System.Threading.Tasks;
using Microprojects.Edm.Auth;
using Microprojects.Edm.Host.Auth;
using Microsoft.AspNetCore.Authentication.Certificate;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authentication.Negotiate;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;

namespace Optosense.Edm.WebApi.Extensions;

public static class EdmAuthExtensions
{
    public static void AddEdmAuth(this IHostApplicationBuilder builder)
    {
        builder.Services.AddDistributedMemoryCache();
        builder.Services.AddSession(session =>
        {
            session.Cookie.Name = ".Edm.Session";
            session.IdleTimeout = TimeSpan.FromMinutes(10);
            session.Cookie.IsEssential = true;
        });
        builder.Services.AddSingleton<IJwtService, JwtService>();

        // Negotiate handler needs Kestrel's IConnectionItemsFeature; non-Windows hosts and TestServer can't supply it.
        var negotiateEnabled = builder.Configuration.GetValue<bool?>("Edm:Auth:Negotiate:Enabled")
            ?? OperatingSystem.IsWindows();
        var defaultChallengeScheme = negotiateEnabled
            ? NegotiateDefaults.AuthenticationScheme
            : JwtBearerDefaults.AuthenticationScheme;

        var authBuilder = builder.Services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = "SmartAuth";
                options.DefaultChallengeScheme = defaultChallengeScheme;
            })
            .AddPolicyScheme("SmartAuth", "SmartAuth", options =>
            {
                options.ForwardDefaultSelector = context =>
                {
                    var authHeader = context.Request.Headers["Authorization"].ToString();
                    if (authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                    {
                        return JwtBearerDefaults.AuthenticationScheme;
                    }
                    if (context.Request.Cookies.ContainsKey("X-Auth-Token"))
                    {
                        return JwtBearerDefaults.AuthenticationScheme;
                    }

                    var grpcSecureUrl = builder.Configuration.GetValue<string>("Kestrel:Endpoints:GrpcSecure:Url");
                    if (!string.IsNullOrEmpty(grpcSecureUrl) &&
                        Uri.TryCreate(grpcSecureUrl.Replace("*", "localhost"), UriKind.Absolute, out var uri) &&
                        context.Connection.LocalPort == uri.Port)
                    {
                        return CertificateAuthenticationDefaults.AuthenticationScheme;
                    }

                    return defaultChallengeScheme;
                };
            });

        if (negotiateEnabled)
        {
            authBuilder.AddNegotiate();
        }

        authBuilder
            .AddJwtBearer(options => ConfigureJwtBearer(options, builder.Configuration))
            .AddCertificate(options => ConfigureCertificate(options, builder.Configuration));

        builder.Services.AddAuthorization(options =>
        {
            options.FallbackPolicy = new AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser()
                .Build();
        });
    }

    public static void UseEdmJwtCookieRefresh(this WebApplication app)
    {
        app.Use(async (context, next) =>
        {
            if (context.User.Identity?.IsAuthenticated == true && ShouldRefreshToken(context))
            {
                var jwtService = context.RequestServices.GetRequiredService<IJwtService>();
                var selectedRole = context.Session.GetString("SelectedRole");
                var token = jwtService.GenerateToken(context.User, selectedRole);
                context.Response.Cookies.Append("X-Auth-Token", token, new CookieOptions
                {
                    HttpOnly = false,
                    Secure = true,
                    SameSite = SameSiteMode.Strict,
                    Expires = DateTimeOffset.UtcNow.AddMinutes(60)
                });
            }
            await next();
        });
    }

    private static bool ShouldRefreshToken(HttpContext ctx)
    {
        if (ctx.User.Identity is WindowsIdentity) return true;
        var exp = ctx.User.FindFirst("exp")?.Value;
        if (exp == null || !long.TryParse(exp, out var seconds)) return true;
        var remaining = DateTimeOffset.FromUnixTimeSeconds(seconds) - DateTimeOffset.UtcNow;
        var threshold = TimeSpan.FromMinutes(
            ctx.RequestServices.GetService<IConfiguration>()
                ?.GetValue<int?>("Edm:Auth:Jwt:RefreshThresholdMinutes") ?? 15);
        return remaining < threshold;
    }

    private static void ConfigureJwtBearer(JwtBearerOptions options, IConfiguration configuration)
    {
        var jwtSettings = configuration.GetSection("Edm:Auth:Jwt");
        // Keep "sub"/"role" short — mapping to long URIs makes the per-request refresh accumulate both forms.
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings["Issuer"],
            ValidAudience = jwtSettings["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["Key"])),
            NameClaimType = "name",
            RoleClaimType = "role"
        };
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                if (string.IsNullOrEmpty(context.Token))
                {
                    context.Token = context.Request.Cookies["X-Auth-Token"];
                }
                return Task.CompletedTask;
            }
        };
    }

    private static void ConfigureCertificate(CertificateAuthenticationOptions options, IConfiguration configuration)
    {
        options.AllowedCertificateTypes = CertificateTypes.All;
        // Private CAs publish no CRL/OCSP; default Online check times out as RevocationStatusUnknown.
        options.RevocationMode = System.Security.Cryptography.X509Certificates.X509RevocationMode.NoCheck;
        options.Events = new CertificateAuthenticationEvents
        {
            OnCertificateValidated = context =>
            {
                var allowedServices = configuration.GetSection("Edm:Auth:RemoteServices").Get<List<string>>()
                    ?? new List<string>();

                // Implicitly allow the cert whose CN matches the host of Edm:Intercom:Principal — auto-trusts the principal host on every peer.
                var principal = configuration["Edm:Intercom:Principal"];
                if (!string.IsNullOrEmpty(principal)
                    && Uri.TryCreate(principal, UriKind.Absolute, out var principalUri)
                    && !string.IsNullOrEmpty(principalUri.Host))
                {
                    allowedServices.Add(principalUri.Host);
                    allowedServices.Add($"CN={principalUri.Host}");
                }

                var subject = context.ClientCertificate.Subject;
                var commonName = context.ClientCertificate.GetNameInfo(System.Security.Cryptography.X509Certificates.X509NameType.SimpleName, false);

                if (allowedServices.Contains(subject) || allowedServices.Contains(commonName))
                {
                    var claims = new[]
                    {
                        new Claim(ClaimTypes.NameIdentifier, commonName ?? subject, ClaimValueTypes.String, context.Options.ClaimsIssuer),
                        new Claim(ClaimTypes.Name, commonName ?? subject, ClaimValueTypes.String, context.Options.ClaimsIssuer),
                        new Claim(ClaimTypes.Role, AuthDefaults.RemoteService, ClaimValueTypes.String, context.Options.ClaimsIssuer)
                    };

                    context.Principal = new ClaimsPrincipal(new ClaimsIdentity(claims, context.Scheme.Name));
                    context.Success();
                }
                else
                {
                    context.Fail("Certificate not allowed");
                }

                return Task.CompletedTask;
            }
        };
    }
}
