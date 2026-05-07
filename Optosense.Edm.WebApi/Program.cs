using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;
using Microprojects.Edm;
using Microprojects.Edm.Utils;
using Microsoft.AspNetCore.Authentication.Certificate;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authentication.Negotiate;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Hosting.WindowsServices;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.EventLog;
using System.Security.Claims;
using System.Security.Principal;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using Microprojects.Edm.Host;
using Microprojects.Edm.Host.Auth;
using Microprojects.Edm.Host.SignalR;
using Microprojects.Edm.Auth;
using Optosense.Edm.WebApi;
using Optosense.Edm.WebApi.Services;
using Optosense.Edm.WebApi.Utils;

var options = new WebApplicationOptions
{
    Args = args,
    ContentRootPath = WindowsServiceHelpers.IsWindowsService() ? AppContext.BaseDirectory : default
};

var builder = WebApplication.CreateBuilder(options);
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();

builder.Services.Configure<IntercomOptions>(builder.Configuration.GetSection("Edm:Intercom"));
builder.Services.Configure<Peer>(options =>
{
    var section = builder.Configuration.GetSection("Kestrel:Endpoints").GetChildren();
    var grpcUri = new Uri(
        section.FirstOrDefault(s => s.Key == "GrpcSecure")?["Url"] ??
        section.FirstOrDefault(s => s.Key == "Grpc")?["Url"]);
    var uiUri = new Uri(
        section.FirstOrDefault(s => s.Key == "Https")?["Url"] ??
        section.FirstOrDefault(s => s.Key == "Http")?["Url"]);
    options.Host = $"{uiUri.Scheme}://{uiUri.Host}";
    options.GrpcPort = grpcUri.Port;
    options.UiPort = uiUri.Port;
    options.Version = typeof(Worker).Assembly.GetName().Version?.ToString();
    options.Mode = builder.Configuration.GetValue<string>("Edm:Mode");
    options.Environment = builder.Environment.EnvironmentName;
});
//System.Diagnostics.Debugger.Launch();
builder.AddCache();
builder.AddOperationIntercom();
builder.Services.AddGrpc();
builder.Services.AddSignalR().AddJsonProtocol(o =>
{
    o.PayloadSerializerOptions.Converters.Add(new JsonStringEnumConverter(allowIntegerValues: false));
});
builder.Services.AddControllers().AddNewtonsoftJson(o => { });
builder.Services.AddPlugins(config =>
{
    config.BaseDirectory = AppContext.BaseDirectory;
    config.PluginsPath = builder.Configuration.GetSection("Edm:Assemblies").GetChildren().Select(c => c.Value);
    config.Configuration = builder.Configuration;
});
builder.Services.AddHostedService<PluginLifecycleService>();
builder.AddJobs();

if (builder.Environment.IsDevelopment())
{
    builder.Services.AddCors(o =>
    {
        o.AddDefaultPolicy(b =>
            b
                .SetIsOriginAllowed(_ => true)
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials()
        );
    });
}

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
    .AddJwtBearer(options =>
    {
        var jwtSettings = builder.Configuration.GetSection("Edm:Auth:Jwt");
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
    })
    .AddCertificate(options =>
    {
        options.AllowedCertificateTypes = CertificateTypes.All;
        // Private CAs publish no CRL/OCSP; default Online check times out as RevocationStatusUnknown.
        options.RevocationMode = System.Security.Cryptography.X509Certificates.X509RevocationMode.NoCheck;
        options.Events = new CertificateAuthenticationEvents
        {
            OnCertificateValidated = context =>
            {
                var allowedServices = builder.Configuration.GetSection("Edm:Auth:RemoteServices").Get<List<string>>()
                    ?? new List<string>();

                // Implicitly allow the cert whose CN matches the host of
                // Edm:Intercom:Principal. Convention: each EDM host's cert CN
                // equals its DNS name, and the Principal URL is built from
                // that name. So the operator only configures Principal once
                // and the owning host's CN is auto-trusted (covers self-sub
                // on the admin and inbound calls from the principal on every
                // peer driver host).
                var principal = builder.Configuration["Edm:Intercom:Principal"];
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
    });

builder.Services.AddAuthorization(options =>
{
    options.FallbackPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();
});
builder.Services.AddWindowsService();
builder.Services.AddHostedService<Worker>()
    .Configure<EventLogSettings>(config =>
    {
        config.LogName = "Microprojects";
        config.SourceName = "EDM Service";
    }).Configure<HostOptions>(options =>
        options.BackgroundServiceExceptionBehavior = BackgroundServiceExceptionBehavior.Ignore);

builder.Services.AddHttpContextAccessor();

var app = builder.Build();

app.UsePeer();
app.UseJobs();
app.JsonConfigure();
app.UseRouting();
if (app.Environment.IsDevelopment())
{
    app.UseCors();
}
app.UseAuthentication();
app.UseAuthorization();
app.UseSession();

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

    static bool ShouldRefreshToken(HttpContext ctx)
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
});

app.UseExceptionHandler();
app.MapGrpcService<EdmJobService>();
app.MapHub<IntercomHub>(IntercomHub.Hub);
app.MapGet("/status", () => "I AM ALIVE!");
app.MapSpaPlugins();

await app.RunAsync();

internal sealed class GlobalExceptionHandler : IExceptionHandler
{
    private readonly ILogger<GlobalExceptionHandler> _logger;
    private readonly IProblemDetailsService _problemDetailsService;

    public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger, IProblemDetailsService problemDetailsService)
    {
        _logger = logger;
        _problemDetailsService = problemDetailsService;
    }

    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception,
        CancellationToken cancellationToken)
    {
        var problemDetails = new ProblemDetails
        {
            Type = "Bad request",
            Status = StatusCodes.Status400BadRequest,
            Title = exception.GetType().Name,
            Detail = exception.GetMeaningfulMessage(),
            Instance = $"{httpContext.Request.Method} {httpContext.Request.Path}"
        };
        _logger.LogError(exception, "{Type}: {Instance} {Message}", problemDetails.Type, problemDetails.Instance,
            problemDetails.Detail);
        httpContext.Response.StatusCode = StatusCodes.Status400BadRequest;
        return await _problemDetailsService.TryWriteAsync(new ProblemDetailsContext
        {
            ProblemDetails = problemDetails,
            HttpContext = httpContext
        });
    }
}