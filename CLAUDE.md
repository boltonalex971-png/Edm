# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

**EDM** is an ASP.NET Core (.NET 10.0, C# 14) platform that hosts feature modules as MEF-loaded plugin DLLs. Most plugins ship an embedded React SPA served by the host at a plugin-specific URL root. The WebApi project (`Optosense.Edm.WebApi`) is the main entry point; it loads assemblies listed under `Edm:Assemblies` in `appsettings.json` and mounts each plugin's SPA from its configured `SpaPath`.

## Solution Layout

The solution file is `Edm.slnx` (XML format, not .sln). Projects are grouped by role:

- **Core Platform** — `Optosense.Edm.WebApi`, `Optosense.Edm.Core`, `Optosense.Edm.Core.AspNet`: host, auth, plugin manager.
- **Domain** — `Optosense.Edm.Domain`: shared base classes only (`DomainObject`, `NamedObject`, `TypeObject`, `HierarchyObject`, `ILogicallyDeletableEntity`). All entity types and EF migrations live in their owning plugin (e.g. `Microprojects.Edm.Ui.Technologies/Persistence/`, `Microprojects.Edm.Ui.Logistics/Persistence/`). Default provider is SQL Server.
- **Infrastructure** — `Optosense.Edm.Infrastructure`, `Edm`: plugin loading, caching, Redis, `Edm/Plugins/PluginManager.cs`.
- **Profile plugins** (`Optosense.Edm.Profiles.*`) — device settings schemas, parameter extraction from profile JSON.
- **Driver plugins** (`Optosense.Edm.Drivers.*`, `Optosense.Edm.Plugins.OpcUa`, `...Operator`) — profile → execution plan, hardware I/O.
- **Operation plugins** (`Optosense.Edm.Operations.*`) — per-run monitoring UIs, typically SignalR-driven and scoped to an `OperationId`.
- **Application plugins** (`Microprojects.Edm.Ui.*`) — top-level modules: `Technologies`, `Console`, `Logistics`. Each has its own domain, controllers, and EF migrations under `Persistence/Migrations/`.

Each plugin class inherits from the matching base (`ProfilePluginBase`, `DriverPluginBase`, or `PluginBase` + `IOperationPlugin`/`IApplicationPlugin`) and is decorated with the corresponding attribute (`[ProfilePlugin]`, `[DriverPlugin]`, `[OperationPlugin]`, `[ApplicationPlugin]`). The attribute's `SpaPath` points at the production SPA build (e.g. `Ui/dist` for Rsbuild, `Ui/build` for CRA); `UiRoot` is the URL prefix where the SPA is mounted.

## Entity Base Classes

New entities should inherit from one of:
- `DomainObject` — just `Id`.
- `NamedObject` — adds `Name`.
- `TypeObject` — adds `Description` and `IsActive` (soft delete via `IsActive`, not row deletion).

Key existing entities: `Profile`, `Device`, `Host`, `Process` (all `TypeObject`); `Record`, `Operation` (`DomainObject`).

## Build and Run

### Backend (.NET 10.0)

```bash
dotnet build Edm.slnx
dotnet build <path-to-csproj>
dotnet test                                  # runs all
dotnet test --filter Name~TestMethodName     # single test
dotnet format
```

Run the host:
```bash
dotnet run --project Optosense.Edm.WebApi
```
or use `run-backend.bat`, which launches the `Optosense.Edm.WebApi-Dev` profile.

### EF Core migrations

Migrations live **per plugin** under `Persistence/Migrations`. Each plugin owns its own `DbContext` (`TechnologiesContext`, `LogisticsContext`, …). The DbContext is resolved via a `--connection-string` passed after `--`, e.g.:

```bash
dotnet ef database update -- --connection-string "Data Source=.\SQLEXPRESS;MultipleActiveResultSets=true;Initial Catalog=optosense_logistics;Integrated Security=SSPI;Encrypt=no;TrustServerCertificate=no;"

dotnet ef migrations add <Name> --output-dir Persistence\Migrations -- --connection-string "..."
dotnet ef migrations remove -- --connection-string "..."
```

See `Microprojects.Edm.Ui.Logistics/logistics-ef-commands.txt` for the canonical logistics commands.

### Frontend (per-plugin SPA)

Run inside the plugin's UI folder (e.g. `Microprojects.Edm.Ui.Logistics/Ui`, `Optosense.Edm.Profiles.Board/Ui`):

```bash
npm install
npm run dev       # Rsbuild-based plugins (modern)
npm start         # react-scripts / CRA plugins (older, e.g. Profiles.Board)
npm run build
npm run check     # biome check --write  (lint + format, Rsbuild plugins)
npm run format    # biome format --write
npm run test      # Jest (CRA plugins only; Rsbuild plugins don't ship a test runner yet)
```

### End-to-end flow after a frontend change

Because the host serves the SPA from `SpaPath` (a build output), a dev-time code change must be built before the backend can serve it:

1. `npm run build` in the plugin's UI folder.
2. `dotnet build` for the containing .NET project.
3. Run the WebApi (`run-backend.bat` or `dotnet run --project Optosense.Edm.WebApi`).
4. Browse to the plugin's `UiRoot` path to verify.

`npm run dev` is fine for SPA-only iteration, but production-parity checks must go through the backend host.

## Code Style

### C#
- `PascalCase` for types, methods, public members; `_camelCase` for private fields; `camelCase` for locals and parameters.
- All I/O (DB, network) is `async`/`await`; suffix with `Async`.
- `ArgumentNullException.ThrowIfNull()` for null checks; `EdmException` for business errors that should surface to the user.
- EF Core: `AsNoTracking()` for reads, `Include`/`ThenInclude` for eager loading.
- Braces on new lines; braces required even for single-statement `if`/`foreach`.

### TypeScript / React
- Functional components + hooks; Redux Toolkit for shared state; `ApiContext` for API base URLs; `usePluginData` from `@microprojects/react-utils` for plugin-scoped data.
- Biome enforces: 4-space indent, single quotes, semicolons `asNeeded`, organized imports. `biome.json` lives in each UI folder.
- Import order: React → external libs → internal components/hooks/utils → styles.

### Line endings
Cursor rule `.cursor/rules/always-use-crlf-for.mdc` is marked `alwaysApply`: use CRLF line endings for text files.

## Plugin scaffolding example

```csharp
[ProfilePlugin(
    Guid = "8E33F54D-D817-44C4-B2ED-1F8FD957CCD6",
    Name = "Board",
    SpaPath = "Ui/build",
    UiRoot = "profiles/board")]
public class BoardProfilePlugin : ProfilePluginBase { ... }
```

Register the plugin DLL under `Edm:Assemblies` in `Optosense.Edm.WebApi/appsettings.json` so the `PluginManager` picks it up.

## Testing

- Backend: MSTest in `Edm.Test` and `Optosense.Edm.Test`.
- Frontend: Jest (CRA plugins). Rsbuild plugins currently have no test runner configured — don't invent one without checking with the user.

## Auth

Before changing anything that touches authentication, authorization, JWT issuance, role enforcement, mutual-TLS plumbing, the SignalR hub auth gate, or any `Edm:Auth` / `Edm:Intercom` / `Kestrel:Endpoints` configuration, **read `docs/specs/auth-implementation-spec.md`** end-to-end. It covers the SmartAuth selector, the Negotiate/JwtBearer/Certificate handlers, the `RequireRolesAttribute` active-role model, outbound mTLS via `IClientCertificateProvider` + `IGrpcJobExecutor`, the Principal-CN auto-trust convention, and the trade-offs already accepted (HS256 with config-file key, no revocation, single `RemoteService` privilege, loopback hub bypass). The "Common changes — where to start" table tells you which file to open first.

Trigger files (any change here implies the spec must be re-read first):
- `Optosense.Edm.WebApi/Program.cs` (auth pipeline section)
- `Optosense.Edm.Core.AspNet/Auth/**`
- `Optosense.Edm.Core.AspNet/SignalR/**`
- `Optosense.Edm.Core/Infrastructure/IClientCertificateProvider.cs`
- `Optosense.Edm.Infrastructure/Edm/Jobs/GrpcJobExecutor.cs` and `IGrpcJobExecutor.cs`
- `Optosense.Edm.Infrastructure/Edm/RemoteJobs.cs`
- any `appsettings*.json` `Edm:Auth`, `Edm:Intercom`, or `Kestrel:Endpoints` section

If reality has drifted from the spec, update the spec in the same change.
