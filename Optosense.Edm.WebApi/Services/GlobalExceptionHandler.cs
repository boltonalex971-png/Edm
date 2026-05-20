using System;
using System.Threading;
using System.Threading.Tasks;
using Microprojects.Edm;
using Microprojects.Edm.Utils;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace Optosense.Edm.WebApi.Services;

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

        // Surface code + params for the frontend's t(code, params) resolver.
        // EdmException is the only carrier today; wrapped EdmException (in
        // InnerException) also counts so wrappers from job/service layers
        // don't strip the catalog key.
        var edm = exception as EdmException ?? exception.InnerException as EdmException;
        if (edm?.Code != null)
        {
            problemDetails.Extensions["code"] = edm.Code;
            if (edm.Params != null)
            {
                problemDetails.Extensions["params"] = edm.Params;
            }
        }

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
