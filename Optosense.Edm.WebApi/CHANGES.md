# EDM Host & Shared Libraries — Technical Changes

This changelog covers the host (`Optosense.Edm.WebApi`) and the libraries loaded into its process: `Optosense.Edm.Core`, `Optosense.Edm.Core.AspNet`, `Optosense.Edm.Domain`, `Optosense.Edm.DataAccess`, `Optosense.Edm.Infrastructure`, `Edm`, `Optosense.Edm`, plus `Optosense.Edm.Setup` and `Microprojects.Edm.Install`. Audience: admins and developers — what shipped, why it matters operationally, and how to use it.

The product version is set in `Optosense.Edm.Setup/Optosense.Edm.Setup.vdproj` (`ProductVersion`). Versions below correspond to the value shipped in the MSI at the time.

## v1.13.28

- **SmartAuth pipeline finalised — mTLS for service-to-service, JWT for browsers** (`a486114`). Browsers continue on `Https:16332` with JwtBearer; remote services and the WebApi's own self-subscription now use `GrpcSecure:16334` with Certificate auth (the endpoint serves both gRPC and SignalR — `Protocols=Http1AndHttp2`). Client-cert loading is centralised behind `IClientCertificateProvider` (interface in `Optosense.Edm.Core/Infrastructure`, impl in `Core.AspNet/Auth`) and applied uniformly: SignalR's outbound `HubConnection` presents it on both the `/negotiate` HTTP path *and* the WebSocket transport; gRPC peer calls go through a new `IGrpcJobExecutor` that owns dispatch (replacing the `X509Certificate2` argument that had been threaded through `StartOperationJob`/`RemoteJobs`). The cert is loaded from `LocalMachine\My` by subject CN, defaulting to `Kestrel:Certificates:Default:Subject` (the install template stamps `[HOSTNAME]`). `Edm:Intercom:Principal` must now point at the GrpcSecure URL (port 16334) — operators pass the matching `--principalUrl` to msiexec at install time. `OnCertificateValidated` parses Principal as a URI and auto-trusts its host (and `CN=<host>`) so peer drivers don't need their own `RemoteServices` entry for the principal. `[Authorize]` now covers `EdmJobService` and the SignalR `/negotiate` handshake; the Certificate handler skips CRL check because private/customer CAs don't publish CRL/OCSP (trust is gated by the `RemoteServices` allow-list). See `docs/specs/auth-implementation-spec.md` for the consolidated picture and `docs/manuals/production-certificates.{en,ru}.md` for the admin walk-through.

## v1.13.27

- **Setup build automation & MSI shutdown hardening** (PR #18). Introduces `Optosense.Edm.Setup/Build-EdmSetup.ps1` and the companion `BUILD.md` covering the full MSI build flow. The MSI now stamps `MSIRMSHUTDOWN=2` so the Restart Manager (server-side, elevated) silently shuts down the EDM service when files are in use, instead of showing the "Files In Use" dialog — the immediate `StopEdmServiceBeforeInstall` CA at sequence 1300 cannot do that itself because immediate CAs run as the launching user, not LocalSystem. The CA's command chain now also runs `taskkill /F /IM Optosense.Edm.WebApi.exe /T` after `net stop edm /y` to release file handles that survive SCM's `SERVICE_STOPPED`, and the `cmd` group separator was switched from the literal `^&` (incorrectly escaped — so `net stop` never ran inside the redirected group) to plain `&`.
- **User-facing changelog system** (PR #17, `c4d54f7`). Each plugin now ships a `CHANGES.md` embedded as a resource, and Logistics exposes `api/logistics/meta/version` and `api/logistics/meta/changelog` so the SPA footer can render the running plugin version, the EDM product version (stamped from the vdproj into a `BuildInfo` constant at compile time) and the changelog itself.

## v1.13.22 (currently shipping)

- **EF migrations executed at install time** (PR 850, PR #4). MSI runs `dotnet ef database update` for the Edm + Logistics contexts via per-context EF bundles (built up-front by `Optosense.Edm.Setup/build-bundles.bat`), so the first launch doesn't hit a missing schema. Connection strings now live in the service's `Environment` registry key (`HKLM\SYSTEM\CurrentControlSet\Services\edm\Environment`) as `ConnectionStrings__Edm` / `ConnectionStrings__Logistics` — not in `appsettings.json` — and are backed up before each `sc delete` so major upgrades don't lose them. The Logistics value, if not supplied, is derived from the Edm one by swapping `optosense_edm` → `optosense_logistics` and persisted back.
- **Installation packaging script + manual** (PR #16). Introduces `Optosense.Edm.Setup/Build-EdmSetup.ps1` and the companion `BUILD.md`. The script passes `/p:FileVersion` only (never `/p:AssemblyVersion`, which cascades through `<ProjectReference>` and breaks plugin loading), runs the MSI patch step in a spawned `powershell.exe` so SummaryInfo COM doesn't fail with `DISP_E_TYPEMISMATCH` after `devenv` had been hosted in the same process, and writes SummaryInfo via `PutDispProperty + Persist` (the high-level accessor silently drops the put on PS 5.1).
- **Role-aware installer + CA tracing** (PR #16). `Microprojects.Edm.Install.exe` now skips connection-string resolution, EF migrations and Environment backup when the install mode is anything other than `admin` — `peer` nodes (the vdproj's default radio-button) talk to a remote admin host and don't need a local DB. Unhandled exceptions in the CA are mirrored to `edm-install-trace.txt` next to the EXE, so MSI's opaque `0xE0434352` exit no longer hides the actual error (capture the file before dismissing the failure dialog — a rolled-back install removes the dir).
- **Sliding auth-cookie with refresh** (PR #6). The cookie is reissued on each request close to expiry, transparently to clients.
- **JWT cookie bloating fix** (PR #5). Claims are trimmed before signing to avoid 4 KB header limits.

### Operational notes
- **MSI custom actions**: immediate CAs run as the *invoking user*, not LocalSystem; deferred CAs run too late to stop services. Use `MSIRMSHUTDOWN=2` at the command line to suppress FilesInUse and let the Restart Manager service-side stop the EDM host.
- **SQL principal** for the EDM service account: local SQL ⇒ `NT AUTHORITY\SYSTEM`; remote SQL ⇒ `DOMAIN\HOSTNAME$`. They are not interchangeable.
- **Migrations** live per-project. Run `dotnet ef database update -- --connection-string "..."` in the project directory; see `Microprojects.Edm.Ui.Logistics/logistics-ef-commands.txt` for the canonical Logistics commands.

## v1.13.0 (PRs 691 – 849)

- **Switch to .NET 10 and NuGet refresh** (PR 799, PR 818). Target framework `net10.0` across the solution; major package bumps; `InvariantGlobalization` removed where it conflicted with `Microsoft.Data.SqlClient` (Open throws `NotSupportedException` otherwise). Update your dev SDK before building.
- **Plugin isolation, lifecycle and Application plugin type** (PR 820, PR 821). Plugins load into their own `AssemblyLoadContext` with explicit `Initialize` / `Shutdown` hooks — the host can hot-reload a plugin DLL without restarting the service. New `[ApplicationPlugin]` attribute used by Main / Console / Logistics.
- **New auth schema for users and services** (PR 819). Cookie + JWT for users; service-to-service uses signed JWT issued by the host. Existing Windows-auth integration still supported via a fallback handler.
- **Async device pipeline** (PR 694, PR 701, PR 717, PR 784, PR 788, PR 811, PR 814). Drivers produce `IAsyncEnumerable<Request>`; lifecycle commands flow through Intercom on a single async path; per-device request/response correlation; jobs and devices initialise before the operation starts; in-flight jobs are stopped synchronously when an operation completes; parallel device starts no longer race on shared parameters.
- **SignalR + inter-frame messaging** (PR 806, PR 807, PR 815). Plugin SPAs talk to the host over SignalR and use `postMessage` between iframes instead of polling. Shared JS utilities (smart scrolling, intercom client) live in npm package `@microprojects/tools`.
- **Logistics plugin added** (PR 707, PR 715, PR 716, PR 732, commit `944575c`). New project `Microprojects.Edm.Ui.Logistics` with its own DbContext, migrations under `Persistence/Migrations`, and connection-string scoping (default catalog `optosense_logistics`); domain entities (`Item`, `Tare`, `Order`, `Process`, `Spec`); plugin DLL and migrations are packed into the MSI.
- **Generic entry controller** (PR 714). Shared CRUD for directory endpoints.
- **Sensor APIs hardened** (PR 684, PR 780, PR 793). Per-sensor endpoints; status reads from the live operation rather than polling the DB; status enum gains a colour mapping consumed by the SPA.
- **Audit DSL changes** (PR 779, PR 785). Audit expressions use `{paramName}` syntax — replace any string-format-style template you may have stored. New `NotEqual` function.
- **UTC-only dates in Domain** (PR 680). Plugins expecting local time should convert at the boundary.
- **Setup project for .NET 10** (PR 817). MSI built under the .NET 10 runtime; service hosting model adjusted. Build-Setup.ps1 + DTProject patch flow — see `Optosense.Edm.Setup/BUILD.md`.
- **Diagnostics & logging** (PR 794, PR 803, PR 805, PR 848). Domain unhandled exceptions are caught and logged with `EventId`; audit exceptions on incoming records no longer take the operation down; current-status endpoint corrected; dev mode launches each plugin's React app under a JS debugger.
- **System.Text.Json upgrade for security CVE** (PR 683).

## v1.12.5 (PRs 588 – 690)

- **Audit pipeline matured** (PR 579, PR 585, PR 591, PR 612). New `equals` function, audit-failures function, null-parameter audit support, and one bad audit no longer takes the operation down.
- **REST API driver plugin added** (PR 582). Adds `Optosense.Edm.Drivers.RestApi` to the load list.
- **Mux command pipeline** (PR 600, PR 603, PR 605). Special `KZ` instruction routing.
- **Intercom resilience** (PR 602, PR 606, PR 607, PR 608, PR 609, PR 610, PR 626, PR 654, PR 665, PR 668). Heartbeat job no longer drops messages; queue-backed transport for flaky links; per-operation `EventId` on log lines (Serilog/EventLog filtering); identity claims include user divisions; HTTPS / Kerberos paths fixed; stale active-hosts pruned; better diagnostics, auto-reconnect and queue-flush.
- **Manifest.json access** (PR 628, PR 668). PWA manifest is reachable to unauthenticated browsers without breaking the auth flow on cookie reads.
- **Background workers don't crash the service** (PR 627). Unhandled exceptions are logged and workers restarted.
- **Plugin app exception JSON** (PR 669). Plugin-thrown exceptions return structured JSON with `Code` / `Message` to the SPA.
- **UTC dates** (PR 680). `Domain` entities expose UTC timestamps; `Core.AspNet` JSON serialisation preserves `Kind=Utc`.
- **Sensor APIs** (PR 684, PR 690). `GET /api/sensors/{id}` and per-sensor measure endpoints.
- **`Record.Parameters` as `Dictionary<string,object>`** (PR 688, PR 689, PR 698). Stored as JSON in SQL; readable with `JSON_VALUE`; comparer added to silence `Include` warnings.
- **Setup process simplified** (PR 593, PR 691). MSI accepts a runtime mode (Production / Development); fewer custom actions; EF bundle invoked from a single CA.
- **Worker discipline** (PR 477, PR 478). Workers honour cancellation; audit jobs attribute the measurement to the originating device.

## v1.12.0 (PRs 572 – 587)

- **Setup version aligned with source** (PR 572).
- **Auto-apply migrations in Development mode** (PR 574). Avoids the "did you run `dotnet ef`?" round-trip for devs; production still requires the EF bundle.
- **Setup specifies Intercom principal** (PR 575). MSI prompts for the service account that owns the Intercom listener.
- **Auth state per request, not session** (PR 566, PR 568). Claims are read from the auth context per request; role change clears cached claims correctly.
- **EF 8 + MS SQL 14 compatibility** (commit `b05bb5b`).
- **Operation parameters mechanic** (PR 569, PR 590). Operations carry a parameter dictionary from start; drivers receive the values.
- **TypeOne config plumbing** (PR 570). Operation plugins can declare a config schema that the Main UI renders.

## v1.0.0 (PRs ≤ 571)

### Platform & runtime
- **First plugin host** (PR 218, PR 226, PR 227, PR 228, PR 286, PR 303). MEF-loaded plugins listed in `appsettings.json` under `Edm:Assemblies`; legacy MVC site replaced by a React SPA per plugin (`SpaPath`); host runs as a Windows service with one process owning all plugins; plugin DLLs are no longer referenced from the host project.
- **Plugin attribute model** (PR 281, PR 282, PR 284, PR 285, PR 286, PR 295). `[ProfilePlugin] / [DriverPlugin] / [OperationPlugin]` finalised; profile plugins build device profiles; operations linked to a Process plugin; workbench-attached-device model.
- **Domain primitives** (PR 275, PR 295, PR 372, PR 376). Generic CRUD service for `TypeObject`-derived entities; hierarchy on config items; profiles know their parameters; workbench-attached devices pick them up.
- **Audit by templates** (PR 294).
- **EDM commands → jobs** (PR 344, PR 347, PR 704). `Job` becomes the unit of scheduled work; `ConcurrentDictionary` for running jobs removes a contention hot-spot at parallel-device scale.
- **MS Logging extension** (PR 364). All projects use `Microsoft.Extensions.Logging`; structured `EventId` is wired through.
- **Roslyn warnings clean-up + EF connection pooling** (PR 348, PR 389). Public surface annotated; treat-warnings-as-errors enabled in CI; DbContext registered as pooled.
- **`EdmException`** is the canonical user-facing exception — translated to JSON `400` by middleware.

### Networking & integration
- **gRPS + Intercom** (PR 303, PR 308, PR 309, PR 310). Host-to-host messaging bus over gRPC; hosts publish heartbeat (`ImAlive`) configurable per peer; Main UI uses heartbeat for online/offline state.
- **API status endpoint** (PR 436). `GET /api/status/istp` to check whether the ISTP integration is alive.
- **OPC UA plugin** (PR 428). New driver/profile pair (`Plugins.OpcUa`).

### Auth (early)
- **Windows authentication** (PR 296). Windows-auth setup added.
- **Fake user info in dev** (commit `2e1b5be`). Development mode lets you spoof identity via config so plugins can be debugged without a domain.

### Setup
- **Initial MSI** (PR 307, commit `004619b`). Visual Studio Installer Project (`.vdproj`); installer rewrites `appsettings.json` (DB, Intercom principal, runtime mode).
- **Setup project for .NET 6** (PR 377, PR 378, PR 381). MSI rebuilt against .NET 6 runtime; service registration updated; Operator plugin packaged.
