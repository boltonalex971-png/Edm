using Microprojects.Edm.Plugins;

namespace Microprojects.Edm.Shared.Services;

/// <summary>
/// Thrown by forkable services when a save would create a new version (the
/// edit is non-trivial and the entity has live or historical references) and
/// the caller has not yet confirmed. Controllers translate this to HTTP 409
/// Conflict so the frontend can prompt the user; on confirmation the request
/// is retried with <c>force=true</c>.
/// </summary>
public class ForkRequiredException : EdmException
{
    public ForkRequiredException(string message) : base(message) { }
}
