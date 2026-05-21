namespace Microprojects.Edm.Shared.Contracts;

// Marker interface for plugin-specific IDirectoryRootRegistry implementations.
// Multiple plugins each register their own IPluginDirectoryRootRegistry; the
// shared CompositeDirectoryRootRegistry aggregates them behind a single
// IDirectoryRootRegistry so a controller in one plugin (e.g. Logistics's
// NomenclaturesController) can still resolve roots its own plugin owns even
// when another plugin (Tech) registered its own IDirectoryRootRegistry into
// the same host service collection.
public interface IPluginDirectoryRootRegistry : IDirectoryRootRegistry
{
}
