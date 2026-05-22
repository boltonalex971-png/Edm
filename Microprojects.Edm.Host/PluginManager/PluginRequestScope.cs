using System;
using System.Threading;

namespace Microprojects.Edm.Host;

// Per-request slot used by PluginScopedControllerActivator and
// PluginScopedHubActivator to publish the HTTP request's root scope so
// the per-plugin DI containers can delegate scoped root-tier services
// (e.g. IUserService, which captures HttpContext in its ctor) into the
// right scope. Without this, the reference-handover factory in
// PluginServiceProviderRegistry would call rootProvider.GetRequiredService
// directly on the ROOT provider — which throws "Cannot resolve scoped
// service from root provider" under .NET's scope-validation mode.
//
// Set in the activator's Create, cleared in Release. The AsyncLocal
// flow-tracks per request so async/await inside the controller still
// sees the right scope.
internal static class PluginRequestScope
{
    private static readonly AsyncLocal<IServiceProvider?> _current = new();

    public static IServiceProvider? Current
    {
        get => _current.Value;
        set => _current.Value = value;
    }
}
