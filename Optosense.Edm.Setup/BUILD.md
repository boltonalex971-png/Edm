# Building the EDM Setup MSI

This document is the authoritative manual procedure for producing
`Optosense.Edm.Setup-<version>.msi`. Use it when the automated paths
are unavailable.

There are three equivalent paths, listed by preference:

1. **Claude Code skill** (fastest if Claude Code is open): run
   `/build-edm-setup` (or `/build-edm-setup Release`). Streams progress
   into the chat and stops on errors.
2. **PowerShell script** (recommended when no agent): run
   `.\Build-EdmSetup.ps1` from this folder. See its `-Help` /
   `Get-Help .\Build-EdmSetup.ps1 -Full` for parameters.
3. **Fully manual procedure** (this document): use only if the
   script itself fails or is unavailable. Each step below mirrors one
   function in the script -- if you change a step here, mirror the
   change in `Build-EdmSetup.ps1` and the
   `.claude/commands/build-edm-setup.md` skill.

The end-to-end build takes roughly 5-8 minutes on a developer machine.
Most of the time is in step 3 (plugin SPA builds) and step 7 (devenv).

## Prerequisites

- **Visual Studio 2026 (VS 18) Community or higher** with the
  *Microsoft Visual Studio Installer Projects* extension. VS 2022 (17)
  cannot target .NET 10 and will not build the WebApi project; the
  Setup vdproj must therefore be built with VS 18's `devenv.com`.
- **.NET 10 SDK** (10.0.6 or newer) on `PATH`. Verify with
  `dotnet --list-sdks`.
- **Node.js with npm** on `PATH`. Verify with `npm --version`. The
  plugin SPA builds rely on whatever `node_modules` is present in each
  plugin's UI folder; if a folder is missing or stale, run
  `npm install` there manually before continuing.
- A **Windows host**. Steps 6, 7, and 8 rely on Windows-only tooling
  (`devenv.com`, `WindowsInstaller` COM, `cmd.exe`).

## Repo layout assumed

The procedure assumes the standard layout under
`C:\Projects\2020\Edm`. If your local clone lives elsewhere, replace
the prefix in every command. The Setup project is
`Optosense.Edm.Setup\Optosense.Edm.Setup.vdproj`; the per-plugin
version state file is `.claude\build-edm-setup-state.json`
(gitignored).

## Output

A successful build produces:

```
Optosense.Edm.Setup\<Configuration>\Optosense.Edm.Setup-<NEW_VER>.msi
```

where `<NEW_VER>` is whatever step 1 bumped to (typically
`major.minor.patch+1`).

---

## Step 1 - Bump `ProductVersion` and regenerate `ProductCode`

**Why.** A major upgrade requires (a) a strictly greater
`ProductVersion` AND (b) a fresh `ProductCode` GUID. Without both,
`msiexec /i` over an existing install fails with *"Another version of
this product is already installed"* and `RemoveExistingProducts` never
fires. `UpgradeCode` (the lineage GUID) is left alone -- that is what
ties the new MSI to old ones as the same product.

The `OutputFilename` is also stamped with the version so successive
builds don't overwrite each other
(`Optosense.Edm.Setup-1.13.14.msi`, `...-1.13.15.msi`, ...).

**How.** Open the vdproj in a text editor (it is a UTF-8-with-BOM,
key-value file -- not XML). Find these lines and edit them:

```
"ProductVersion" = "8:1.13.13"
"ProductCode"    = "8:{...some GUID...}"
"OutputFilename" = "8:Debug\\Optosense.Edm.Setup-1.13.13.msi"
```

Bump `ProductVersion` (last segment +1), generate a fresh GUID for
`ProductCode` (e.g. `[guid]::NewGuid()` in PowerShell), and update
both `OutputFilename` lines (Debug and Release variants) to match the
new version. **Preserve the BOM** -- if you edit in Notepad, save as
UTF-8 (Notepad keeps BOM by default; VS Code may need an explicit
choice).

> **Trap.** If you save the vdproj without a BOM, devenv's vdproj
> parser becomes erratic on subsequent loads. Always check the file
> still starts with `EF BB BF` (use a hex viewer, or
> `(Get-Content $f -Raw -AsByteStream)[0..2]` in PowerShell 7).

---

## Step 2 - Build the EF migration bundles

**Why.** The MSI ships self-contained EF Core migration bundles
(`*.efbundle.exe`) next to `WebApi.exe`. At install time the custom
action runs them with `--connection <db>` and the bundles read
`__EFMigrationsHistory` to apply only the migrations missing on the
target database.

**Why before step 3.** `dotnet ef migrations bundle` rebuilds the
Logistics csproj as a side effect WITHOUT the `/p:FileVersion` we
will pass in step 3. If step 3 ran first, this rebuild would silently
revert the Logistics FileVersion to the default and undo the bump.
EF bundles first means step 3's `dotnet build` is the LAST thing to
touch plugin DLLs.

**How.**

```
cmd.exe /c C:\Projects\2020\Edm\Optosense.Edm.Setup\build-bundles.bat
```

The batch file produces two artefacts:

- `Microprojects.Edm.Ui.Technologies\bin\<Config>\net10.0\Microprojects.Edm.Ui.Technologies.efbundle.exe`
- `Microprojects.Edm.Ui.Logistics\bin\<Config>\net10.0\Microprojects.Edm.Ui.Logistics.efbundle.exe`

> **Trap.** The connection strings inside `build-bundles.bat` are
> *design-time only* -- EF tools need them to resolve `DbContext` /
> `IDesignTimeDbContextFactory`. The runtime connection string is
> passed by `Microprojects.Edm.Install.exe --connection <db>` at
> install time, NOT baked into the bundle.

---

## Step 3 - Rebuild plugin SPAs and DLLs (FileVersion-only)

**Why plugins need explicit rebuilding.** Plugin csprojs embed their
React build output (`Ui/dist` or `ClientApp/build`) as managed
resources. They are MEF-loaded at runtime via `PluginManagerHelper`,
so they are NOT in WebApi's project-reference graph. Neither
`dotnet publish Optosense.Edm.WebApi` nor the devenv Setup build
rebuilds them. Without this step the MSI ships whatever DLL was last
produced manually -- UI changes silently do not reach end users.

**Why FileVersion needs to bump.** If anyone ever reverts the
REP-at-1399 patch in step 8, MSI Component Rules will refuse to
overwrite plugin DLLs whose `FileVersion` matches the already-installed
copy. Bumping `FileVersion` only when sources actually changed makes
upgrades reliable without spurious bumps cluttering MSI deltas.

> **Critical: only `FileVersion` -- never `AssemblyVersion` /
> `Version`.** `AssemblyVersion` cascades through `<ProjectReference>`
> chains. A plugin build with `/p:AssemblyVersion=X` also rebuilds
> shared `Optosense.Edm.Core.dll`, `Domain.dll`, etc. into the
> plugin's bin folder at version `X`. WebApi is published in step 4
> WITHOUT this property, so its embedded copies of those shared DLLs
> stay at `1.0.0.0`. At runtime
> `Optosense.Edm.Core.AspNet.OptosenseLoadContext.Load` matches
> shared assemblies by full `AssemblyName.FullName`
> (Name+Version+Culture+PublicKey), so the plugin's request for
> `Optosense.Edm.Core, Version=X` against a default-ALC
> `Version=1.0.0.0` returns `null`. `assembly.GetTypes()` then throws
> `ReflectionTypeLoadException` and the plugin fails to load. The
> migration bundle that loads plugins at startup propagates that
> failure as exit-1, and the MSI rolls back. `FileVersion` is metadata
> only and doesn't affect assembly binding, so it satisfies Component
> Rules without breaking the loader.

**How.** For each plugin folder in the table below:

| csproj                                  | UI folder    |
| --------------------------------------- | ------------ |
| `Microprojects.Edm.Ui.Logistics`        | `Ui`         |
| `Microprojects.Edm.Ui.Console`          | `Ui`         |
| `Microprojects.Edm.Ui.Technologies`             | `ClientApp`  |
| `Optosense.Edm.Plugins.Operator`        | `Ui`         |
| `Optosense.Edm.Profiles.Board`          | `Ui`         |
| `Optosense.Edm.Operations.Optogen`      | `Ui`         |
| `Optosense.Edm.Drivers.Null`            | `Ui`         |

```
cd <plugin-root>\<UI folder>
npm.cmd run build
cd <plugin-root>
dotnet build .\<plugin>.csproj -c <Configuration> /p:FileVersion=1.0.0.<n>
```

> **Trap: use `npm.cmd`, NOT `npm`.** Bare `npm` resolves to
> `npm.ps1`, which the default Windows ExecutionPolicy blocks. The
> resulting `PSSecurityException` does NOT set `$LASTEXITCODE`, so a
> naive `if ($LASTEXITCODE) { throw }` silently passes through with
> stale `dist/` embedded in the DLL.

**Picking `<n>`.** The recommended approach is the per-plugin
SHA256 fingerprint persisted at `.claude\build-edm-setup-state.json`
(the script does this automatically). When building manually:

- If you know the plugin's source has not changed since the last
  successful Setup build, reuse the prior `FileVersion`.
- If anything in the plugin changed (C#, SPA, csproj), bump the last
  segment by 1.

When in doubt, bump. The cost of a spurious bump is just a few
kilobytes of MSI delta.

> **Trap.** The `.cursor/rules/always-use-crlf-for.mdc` rule applies
> repo-wide. Do NOT run `npm run check` or `npm run format` in the
> Logistics UI folder during a build -- biome is configured to write
> LF. Run those during normal development, not during a Setup build.

---

## Step 4 - Publish the WebApi single-file EXE

**Why.** The Setup vdproj's "Primary Output" item picks up WebApi's
publish folder as one EXE plus a small set of native assets (e.g.
`Microsoft.Data.SqlClient.SNI.dll`, `appsettings.json`). All managed
dependencies (`Optosense.Edm.Core`, `Domain`, `Infrastructure`, ...)
are embedded inside the EXE.

**How.**

```
dotnet publish C:\Projects\2020\Edm\Optosense.Edm.WebApi\Optosense.Edm.WebApi.csproj -c <Configuration>
```

Publish settings (`PublishSingleFile`, `PublishReadyToRun`,
`RuntimeIdentifier=win-x64`) are baked into the csproj, so no extra
flags are needed.

---

## Step 5 - Publish the installer custom-action EXE

**Why.** `Microprojects.Edm.Install.exe` runs at MSI Install/Uninstall
time. It registers the Windows service, writes `appsettings.json`,
restores the service `Environment` registry value across upgrades,
and applies EF migrations via the bundles from step 2. The vdproj
packages the publish output of this csproj as a separate file under
the install dir.

**How.**

```
dotnet publish C:\Projects\2020\Edm\Microprojects.Edm.Install\Microprojects.Edm.Install.csproj -c <Configuration>
```

> **Diagnostic aid.** The EXE wraps its top-level switch in a
> try/catch that mirrors any unhandled exception (with full stack
> trace) to `edm-install-trace.txt` colocated with the EXE in the
> install dir (e.g. `C:\Program Files\Microprojects\Edm\edm-install-trace.txt`).
> MSI does not capture stdout/stderr from EXE custom actions, so
> without this trace any failure surfaces only as opaque exit
> `0xE0434352`. **Caveat:** a failed install rolls back and removes
> the install dir, so copy the trace before dismissing the failure
> dialog.

---

## Step 6 - Clear stale bootstrapper outputs

**Why.** devenv occasionally fails with the intermittent
`error 8007006E: Unable to finish updating resource for ... setup.exe`
when patching resources of an existing `setup.exe` stub left in a bad
state by a prior aborted build. Removing `setup.exe` and `*.tmp` lets
the next devenv invocation regenerate them cleanly.

**How.**

```powershell
Remove-Item "C:\Projects\2020\Edm\Optosense.Edm.Setup\<Configuration>\*.tmp"   -Force -ErrorAction SilentlyContinue
Remove-Item "C:\Projects\2020\Edm\Optosense.Edm.Setup\<Configuration>\setup.exe" -Force -ErrorAction SilentlyContinue
```

---

## Step 7 - Build the Setup vdproj with devenv

**Why devenv (not msbuild).** Only Visual Studio understands
`.vdproj`. `dotnet build` and `msbuild` reject it.

**Why VS 18.** vdproj inherits the targeted runtime from the Setup
project entries and Optosense.Edm.WebApi targets `net10.0`. VS 2022
(17) does not ship .NET 10 targeting packs.

**Why `/ProjectConfig`.** The solution-level Debug config excludes
the Setup project (vdproj builds are slow and unwanted on every
dev F5). Without `/ProjectConfig`, devenv reports
`Skipped Build: Project: Optosense.Edm.Setup` and silently exits
with code 0 -- the build did NOT produce a fresh MSI even though
exit code is 0.

**How.**

```
"C:\Program Files\Microsoft Visual Studio\18\Community\Common7\IDE\devenv.com" ^
    C:\Projects\2020\Edm\Edm.slnx /Build "<Configuration>|Any CPU" ^
    /Project "Optosense.Edm.Setup\Optosense.Edm.Setup.vdproj" ^
    /ProjectConfig <Configuration>
```

After the build, look for `Packaging file '...'` lines in stdout to
confirm the Setup project actually built. The last line should read
`Packaging file 'Microprojects.Edm.Ui.Logistics.efbundle.exe'`
followed by `Build: 10 succeeded, 0 failed, 0 up-to-date, 0 skipped`.

> **Trap.** If devenv still fails with `error 8007006E` after the
> step 6 cleanup, retry once -- this error is occasionally triggered
> by antivirus scanning the output mid-write. If it fails twice,
> investigate; do not blanket `--no-restore` or otherwise hide it.

---

## Step 8 - Patch the MSI

The vdproj IDE cannot express any of these tweaks, so we drive the
Windows Installer COM API directly after devenv finishes. Three
changes:

1. **Add a CustomAction** that stops the `edm` service synchronously
   before any file-lock check.
2. **Re-sequence `RemoveExistingProducts`** to 1399 (before
   `InstallValidate` at 1400).
3. **Regenerate the PackageCode** so Windows Installer treats the
   patched MSI as a distinct package.

### Why (1) -- a NEW CA even though step 8 already moves REP early

When `RemoveExistingProducts` fires, it triggers a *nested* uninstall
of the **previously installed** product. That nested uninstall runs
the OLD `Microprojects.Edm.Install.exe`'s `/Uninstall` code -- so any
improvement to that EXE only takes effect *one upgrade later*. To
break the chicken-and-egg, the NEW MSI itself runs `net stop edm /y`
(synchronous -- `net stop` blocks until the SCM reports Stopped,
unlike `sc stop`) at sequence 1300, before REP at 1399 and before
`InstallValidate` at 1400. By the time `InstallValidate`'s Restart
Manager scan runs, the service is genuinely down and no
*Files in Use* dialog appears.

### Why Type 50 (EXE-from-property), not Type 38 (inline VBScript)

Empirically, Type 38 with `WScript.Shell.Run` produced an empty trace
file (no output, no exit code) -- MSI's inline VBScript host doesn't
expose `WScript` reliably. Type 50 calls `cmd.exe` directly via a
property holding the path; `cmd`'s stdout/stderr is redirected to a
trace file (`[TARGETDIR]edm-stop-trace.txt`, e.g.
`C:\Program Files\Microprojects\Edm\edm-stop-trace.txt`) so the CA's
effects are auditable, and the file ends up next to the install CA's
own `edm-install-trace.txt` and the per-bundle `*.efbundle.log` files.
A `mkdir "[TARGETDIR]."` prefix is required because StopEdm fires at
sequence 1300, before `CreateFolders`/`InstallFiles`, so on a clean
first install the dir does not yet exist. `+ 64` makes the CA
"Continue": a non-zero exit (e.g. `1060` *"service not installed"* on
a clean install) does not fail the install. So the final type is
`114 = 50 + 64`.

### Why (2) -- REP at 1399, not the VS-default 6650

REP at 6650 (after `InstallFinalize`) means the old `edm` service
registry entry is still alive when the new install runs -- the new
`/Install` then fails on `sc create edm` because the name is taken.
Plus Component Rules then refuse to overwrite plugin DLLs whose
FileVersion matches the installed copy. Placing REP at 1399 lets the
nested old-uninstall remove the service *before* the new one tries
to create it; InstallFiles then writes fresh files and the service
is created cleanly. Microsoft's documented placement (between
`InstallValidate` 1400 and `InstallInitialize` 1500) doesn't help
here because `InstallValidate`'s Restart Manager scan would still
see the old service holding files.

### Why (3) -- regenerate PackageCode

`PackageCode` (Summary Information property 9) identifies the
specific bytes of the MSI. We modify those bytes *after* devenv
writes them, so the original `PackageCode` is stale. A cached
`LocalPackage` in `%WINDIR%\Installer\` matching the old
`PackageCode` would otherwise be served by Windows Installer on
subsequent operations, ignoring our patches.

### How

Run this from a PowerShell prompt -- the easiest manual path is to
copy the body of `Invoke-PatchMsi` from `Build-EdmSetup.ps1` into
the prompt. Substitute `$msi`, `$Configuration`, and the version
inline. The condensed version:

> **Note for the script (Build-EdmSetup.ps1).** The script does the
> exact same patching but spawns a fresh `powershell.exe` child
> process for it. Reason: running the COM calls in the *same*
> PowerShell process that hosted devenv (step 7) raises
> `DISP_E_TYPEMISMATCH` (HRESULT 0x80020005) on the very first
> `OpenDatabase` -- some persistent state pollution that survives
> waits and retries. A manual run in a fresh PS prompt has no such
> pollution, so the inline COM calls below work exactly as written.

```powershell
$msi = "C:\Projects\2020\Edm\Optosense.Edm.Setup\<Configuration>\Optosense.Edm.Setup-<NEW_VER>.msi"
$installer = New-Object -ComObject WindowsInstaller.Installer
$db = $installer.GetType().InvokeMember('OpenDatabase', 'InvokeMethod', $null, $installer, @($msi, 1))

function Exec($db, $sql) {
    $v = $db.GetType().InvokeMember('OpenView', 'InvokeMethod', $null, $db, @($sql))
    $v.GetType().InvokeMember('Execute', 'InvokeMethod', $null, $v, $null) | Out-Null
}

# Property: cmd.exe path used as the EXE Source for the CA.
Exec $db "DELETE FROM Property WHERE Property='SVC_STOP_CMD'"
Exec $db "INSERT INTO Property (Property,Value) VALUES ('SVC_STOP_CMD','C:\Windows\System32\cmd.exe')"

# MSIRMSHUTDOWN=2 -- the real fix for "EDM Service is using files".
# Immediate CAs in InstallExecuteSequence run as the launching user (only
# deferred+NoImpersonate runs as LocalSystem), so our StopEdm CA at 1300
# can't actually stop the service. MSIRMSHUTDOWN=2 tells MSI's RM to
# silently shut things down at InstallValidate instead of showing the
# FilesInUse dialog -- RM runs server-side (elevated) and CAN stop the
# service.
Exec $db "DELETE FROM Property WHERE Property='MSIRMSHUTDOWN'"
Exec $db "INSERT INTO Property (Property,Value) VALUES ('MSIRMSHUTDOWN','2')"

# CustomAction: Type 114 (50 + 64 Continue), Source=property, Target=cmd args.
# `mkdir "[TARGETDIR]."` ensures the install dir exists at sequence 1300,
# before MSI's CreateFolders. Trailing "." form avoids cmd's trailing-\" pitfall.
#
# DO NOT use `^&` between commands inside the parens. cmd treats `^&` as the
# ESCAPED form of `&` (a literal `&` character), not a command separator --
# so the entire group degenerates to a single echo and `net stop` never runs.
# Plain `&` is the correct separator. `taskkill /F /T` is belt-and-suspenders
# in case the service process keeps file handles past SCM's SERVICE_STOPPED
# notification (otherwise InstallValidate at 1400 still sees them and shows
# "EDM Service is using files").
Exec $db "DELETE FROM CustomAction WHERE Action='StopEdmServiceBeforeInstall'"
$tgt = '/c mkdir "[TARGETDIR]." 2>nul & (echo === %DATE% %TIME% StopEdm CA fired === & net stop edm /y & taskkill /F /IM Optosense.Edm.WebApi.exe /T) >> "[TARGETDIR]edm-stop-trace.txt" 2>&1'
Exec $db "INSERT INTO CustomAction (Action,Type,Source,Target) VALUES ('StopEdmServiceBeforeInstall',114,'SVC_STOP_CMD','$tgt')"

# Sequence: StopEdm at 1300, REP at 1399.
Exec $db "DELETE FROM InstallExecuteSequence WHERE Action='StopEdmServiceBeforeInstall'"
Exec $db "INSERT INTO InstallExecuteSequence (Action,Condition,Sequence) VALUES ('StopEdmServiceBeforeInstall','',1300)"
Exec $db "UPDATE InstallExecuteSequence SET Sequence=1399 WHERE Action='RemoveExistingProducts'"

# Regenerate PackageCode BEFORE the database Commit. The Summary Information
# stream lives inside the same OLE compound file as the database tables, and
# only db.Commit() flushes the compound file to disk -- Persist alone stages
# the change in the open handle. Commit-then-Persist silently drops the
# summary write.
#
# Use BindingFlags 'PutDispProperty' (DISPATCH_PROPERTYPUT), not 'SetProperty':
# the generic 'SetProperty' raises DISP_E_TYPEMISMATCH on PS 5.1 for
# SummaryInfo.Property(pid)=val. The high-level accessor `$si.Property(9)=$val`
# looks like it works in-memory but its put never reaches the COM dispatch,
# so Persist commits nothing.
$si = $db.SummaryInformation(1)
$pkg = "{$([guid]::NewGuid().ToString().ToUpper())}"
$si.GetType().InvokeMember('Property', 'PutDispProperty', $null, $si, @([int]9, [string]$pkg)) | Out-Null
$si.Persist()

$db.GetType().InvokeMember('Commit', 'InvokeMethod', $null, $db, @()) | Out-Null

[System.Runtime.InteropServices.Marshal]::ReleaseComObject($si)        | Out-Null
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($db)        | Out-Null
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($installer) | Out-Null
[GC]::Collect(); [GC]::WaitForPendingFinalizers()

"PackageCode -> $pkg"
```

> **Why `InvokeMember`.** `WindowsInstaller.Installer` is a
> late-bound COM object. PowerShell's COM adapter cannot resolve its
> overloaded methods (e.g. `View.Close()`, `CreateRecord(int)`) and
> returns a confusing "Method 'System.Object[].X' not found" error.
> Explicit `InvokeMember` calls work around this. Note that View
> objects are implicitly closed when garbage-collected, so we do NOT
> attempt to `Close()` them.

---

## Verifying the result

After step 8, the MSI is at:

```
Optosense.Edm.Setup\<Configuration>\Optosense.Edm.Setup-<NEW_VER>.msi
```

Quick sanity checks:

```powershell
$msi = "C:\Projects\2020\Edm\Optosense.Edm.Setup\<Configuration>\Optosense.Edm.Setup-<NEW_VER>.msi"
"Size: $([math]::Round((Get-Item $msi).Length / 1MB, 2)) MB"

# Confirm REP and StopEdm are sequenced as expected.
$installer = New-Object -ComObject WindowsInstaller.Installer
$db = $installer.GetType().InvokeMember('OpenDatabase', 'InvokeMethod', $null, $installer, @($msi, 0))  # mode 0 = read-only
$v = $db.GetType().InvokeMember('OpenView', 'InvokeMethod', $null, $db,
    @("SELECT Action,Sequence FROM InstallExecuteSequence WHERE Sequence > 1099 AND Sequence < 1500"))
$v.GetType().InvokeMember('Execute', 'InvokeMethod', $null, $v, $null) | Out-Null
while ($true) {
    $r = $v.GetType().InvokeMember('Fetch', 'InvokeMethod', $null, $v, $null)
    if ($null -eq $r) { break }
    $a = $r.GetType().InvokeMember('StringData',  'GetProperty', $null, $r, @(1))
    $s = $r.GetType().InvokeMember('IntegerData', 'GetProperty', $null, $r, @(2))
    "{0,4}  {1}" -f $s, $a
}
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($db)        | Out-Null
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($installer) | Out-Null
```

Expected output between sequences 1300 and 1400:

```
1300  StopEdmServiceBeforeInstall
1399  RemoveExistingProducts
1400  InstallValidate
```

## Pre-install database setup

> **Required only for the `Administrative` role.** The installer
> dialog offers two roles: `Administrative` (button 1, value `admin`)
> and `Device control` (button 2, value `peer`, the default). Only
> the admin role hosts the EDM admin app and therefore needs both
> `optosense_edm` and `optosense_logistics`; peer installs talk to a
> remote admin host and skip all DB-related install steps entirely
> (the install EXE's `EnsureDatabaseExists` pre-flight + EF migrations
> are gated on `mode == admin`). If you're installing a peer/device-
> control node, skip this whole section.

The installer does NOT create databases. It runs as `LocalSystem`
(the Windows service installation context). The SQL principal that
sees the connection depends on whether SQL Server is local or remote
to the install host:

- **Local SQL** (same machine, `.\SQLEXPRESS`, `localhost`, etc.):
  the connection arrives as `NT AUTHORITY\SYSTEM` -- the well-known
  LocalSystem SID `S-1-5-18`. Grant `db_owner` to `NT AUTHORITY\SYSTEM`.
- **Remote SQL** (different host, IP/FQDN): the connection arrives
  as the machine account of the install host -- `DOMAIN\HOSTNAME$`,
  the computer name with a trailing `$`. Grant `db_owner` to that.

Confirm which one your SQL sees by running, on the install host as
`LocalSystem` (or via `psexec -s sqlcmd ...`):
```sql
SELECT SUSER_SNAME();   -- prints the SQL-side login name
```

Before running `msiexec`, a SQL admin must:
1. Create both target databases.
2. Grant the appropriate principal `db_owner` on each.

Run this once as `sa` (or any login with `dbcreator` + `securityadmin`).
The script picks the LOCAL SQL principal (`NT AUTHORITY\SYSTEM`); for
remote SQL, replace every `[NT AUTHORITY\SYSTEM]` with
`[OPTOSENSE\ISTP$]` (your `DOMAIN\HOSTNAME$`). Idempotent -- safe to
re-run.

```sql
USE master;
GO

-- NT AUTHORITY\SYSTEM is normally pre-registered as a login on local
-- SQL Server installs; this is just defensive in case it was removed.
IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'NT AUTHORITY\SYSTEM')
    CREATE LOGIN [NT AUTHORITY\SYSTEM] FROM WINDOWS;

IF NOT EXISTS (SELECT 1 FROM sys.databases WHERE name = 'optosense_edm')
    CREATE DATABASE [optosense_edm];
IF NOT EXISTS (SELECT 1 FROM sys.databases WHERE name = 'optosense_logistics')
    CREATE DATABASE [optosense_logistics];
GO

USE [optosense_edm];
GO
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'NT AUTHORITY\SYSTEM')
    CREATE USER [NT AUTHORITY\SYSTEM] FOR LOGIN [NT AUTHORITY\SYSTEM];
ALTER ROLE db_owner ADD MEMBER [NT AUTHORITY\SYSTEM];
GO

USE [optosense_logistics];
GO
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'NT AUTHORITY\SYSTEM')
    CREATE USER [NT AUTHORITY\SYSTEM] FOR LOGIN [NT AUTHORITY\SYSTEM];
ALTER ROLE db_owner ADD MEMBER [NT AUTHORITY\SYSTEM];
GO
```

> **Local vs remote, in detail.** A service token running as
> `LocalSystem` (`S-1-5-18`) is a *local* identity. When it opens a
> SQL connection over a network transport (TCP/IP to a different
> host), Windows authentication switches to the host's Kerberos
> machine credential, which the remote SQL sees as `DOMAIN\HOSTNAME$`.
> When the same token connects in-process (Shared Memory, Named
> Pipes, or TCP loopback to the same host), SQL sees the original
> `NT AUTHORITY\SYSTEM`. That's why the same install service can
> need *different* SQL principals depending on where SQL lives.
>
> If you don't want to grant either local-system flavor (e.g. SQL
> is in a different AD domain or you want auditing per-service),
> use a SQL Authentication account in the connection string
> instead. The installer accepts any connection string format,
> Integrated Security or otherwise.

The installer's `EnsureDatabaseExists` pre-flight check tries to open
each connection before invoking the EF migration bundles. If the
database is missing or the install account lacks access, the install
fails fast with a single line naming the database, the SQL server,
and which principal needs to be granted -- not the EF stack trace.

## Installing and post-mortem

The installer is run by the user, not by the build. From a Windows
host with admin rights:

```
msiexec /i "Optosense.Edm.Setup-<NEW_VER>.msi" /l*v "%TEMP%\edm-install.log"
```

If something goes wrong, the most useful artefacts are:

All install-time trace files now land in the install target dir
(typically `C:\Program Files\Microprojects\Edm\`). `%TEMP%\edm-install.log`
is the only one outside it -- it's the MSI engine log written by
msiexec itself.

| File                                                                 | What it tells you                                                      |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `%TEMP%\edm-install.log`                                             | Full MSI engine log (Action sequence, file copy decisions, CA stdout). |
| `C:\Program Files\Microprojects\Edm\edm-stop-trace.txt`              | Output from the `StopEdmServiceBeforeInstall` CA (`net stop` result).  |
| `C:\Program Files\Microprojects\Edm\edm-install-trace.txt`           | Unhandled exception from `Microprojects.Edm.Install.exe` (full stack). |
| `C:\Program Files\Microprojects\Edm\*.efbundle.log`                  | Per-bundle EF Core migration transcript (one per migration bundle).    |
| Windows Event Log -> Application                                     | .NET unhandled-exception fallback when the trace file is missing.      |

> **Trap.** A failed install rolls back. Because every trace file
> above (except `%TEMP%\edm-install.log`) lives inside the install
> dir, MSI's rollback deletes them along with the rest of
> `C:\Program Files\Microprojects\Edm\`. Copy the files out BEFORE
> acknowledging the failure dialog. The MSI engine log
> (`%TEMP%\edm-install.log`) survives a rollback and is the only
> trace you can rely on collecting after the fact.

## Troubleshooting

**`Skipped Build: Project: Optosense.Edm.Setup`** in step 7.
Cause: missing `/ProjectConfig <Configuration>`. The build exits 0
but produces no MSI. Re-run step 7 with the flag.

**`error 8007006E: Unable to finish updating resource for ... setup.exe`**.
Cause: leftover bootstrapper from a prior aborted build, possibly
locked by AV. Re-run step 6, then step 7 once. Retry step 7 a second
time if it persists.

**MSI install fails immediately with `Another version of this product is already installed`**.
Cause: ProductVersion was not bumped, OR ProductCode wasn't
regenerated. Both are required. Re-run step 1 with care.

**`Cannot connect to database '<name>' on SQL server '<host>'`**
in `edm-install-trace.txt` (or in the MSI engine log if rollback
already nuked the install dir).
Cause: an `Administrative`-role install hit a missing database or a
login that has no SQL access. The installer does NOT create
databases. Run the SQL in "Pre-install database setup" above as
`sa` (or any login with `dbcreator` + `securityadmin`). Pick the
right principal:
- **LOCAL SQL** (same host as the installer): grant `db_owner` to
  `NT AUTHORITY\SYSTEM`. This is the LocalSystem SID, NOT the
  machine account -- a common confusion.
- **REMOTE SQL**: grant `db_owner` to `DOMAIN\HOSTNAME$` (the
  install host's machine account, with a trailing `$`).

Verify with `SELECT SUSER_SNAME()` from a service-context query on
the install host. If you intended a device-control node, re-run
`msiexec` and pick the `Device control` radio button instead --
peer installs don't need any database.

**Files in Use dialog during install**.
Cause: the `StopEdmServiceBeforeInstall` CA didn't fire, or
`net stop edm` failed. Check
`C:\Program Files\Microprojects\Edm\edm-stop-trace.txt` (path will
match whatever `[TARGETDIR]` resolved to).
- File missing entirely -> CA did not fire, or its `mkdir
  "[TARGETDIR]."` prefix was stripped during patching. Re-run step 8
  and verify the sequence ordering with the script in
  "Verifying the result" above.
- Empty file -> CA fired but cmd's redirect failed; usually means
  the install dir wasn't creatable (permissions / path).
- Non-empty but no Stopped output -> the service was already running
  under a different name or the CA was racing some other locker.

**Plugin DLLs after upgrade still show old date stamp / old version.**
Cause: REP scheduled too late, OR plugin FileVersion didn't change.
Confirm via the verification script that REP is at 1399 and that
the per-plugin FileVersion advanced.

**Migration bundle exits with code 1 during install**.
Capture `C:\Program Files\Microprojects\Edm\edm-install-trace.txt`
(path will match whatever `[TARGETDIR]` resolved to) -- it has the
full stack trace. Copy it BEFORE dismissing the MSI failure dialog;
rollback removes the install dir. The most common cause is a plugin
failing to load with `ReflectionTypeLoadException`, which usually
means someone passed `/p:AssemblyVersion=...` to a plugin build --
see the warning in step 3.
