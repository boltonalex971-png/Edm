using Microsoft.AspNetCore.Http;

namespace Microprojects.Edm.Ui.Logistics.Events;

// Reads the originator's SignalR connection id from the request header
// the client adds via an axios interceptor. Used to stamp outgoing
// LogisticsMessages so receivers can suppress self-echo. Returns null
// when no header is present (legacy clients, server-initiated work).
public interface IConnectionOrigin
{
    string? ConnectionId { get; }
}

public class HttpHeaderConnectionOrigin : IConnectionOrigin
{
    public const string HeaderName = "X-Edm-Connection-Id";

    private readonly IHttpContextAccessor _accessor;

    public HttpHeaderConnectionOrigin(IHttpContextAccessor accessor)
    {
        _accessor = accessor;
    }

    public string? ConnectionId
    {
        get
        {
            var headers = _accessor.HttpContext?.Request.Headers;
            if (headers == null) return null;
            if (!headers.TryGetValue(HeaderName, out var value)) return null;
            var s = value.ToString();
            return string.IsNullOrEmpty(s) ? null : s;
        }
    }
}
