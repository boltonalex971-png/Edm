using System;
using System.Reflection;

namespace Microprojects.Edm.Plugins;

// Host-side resolver from plugin (or plugin's assembly) → that plugin's
// IServiceProvider. Each plugin's leaf services (DirectoryService,
// IDirectoryRootRegistry, INomenclatureService, IHostService, …) live in
// a per-plugin container; the custom IControllerActivator + IHubActivator
// look up the right plugin via this provider when activating a controller
// or hub. Root-tier services (configuration, logging, jobs, plugin
// container, IUserService) are delegated through reference-handover
// descriptors so each plugin sees the same shared instances.
public interface IPluginServiceProvider
{
    // Opens an empty IServiceProvider for the given plugin. Throws if the
    // plugin is unknown.
    IServiceProvider GetProviderFor(IPlugin plugin);

    // Maps a controller / hub assembly to the owning plugin's provider.
    // Returns null when the assembly is not a plugin assembly (e.g.
    // controllers that live in the host itself); callers should fall back
    // to the root provider in that case.
    IServiceProvider? TryGetProviderFor(Assembly assembly);
}
