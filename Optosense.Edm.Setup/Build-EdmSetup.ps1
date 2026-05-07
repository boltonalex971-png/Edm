<#
.SYNOPSIS
    Builds the Optosense.Edm.Setup MSI end-to-end.

.DESCRIPTION
    Runs the full MSI build pipeline: version bump -> EF migration bundles ->
    plugin SPA + DLL builds with per-plugin FileVersion bumping -> WebApi
    single-file publish -> installer custom-action publish -> Setup vdproj
    build -> MSI post-patching (stop-service custom action, RemoveExistingProducts
    re-sequencing, fresh PackageCode).

    Fails fast on any non-zero step. Run from any working directory; paths
    are resolved relative to the script's own location.

    The script and the BUILD.md document next to it are the authoritative
    procedures. The /build-edm-setup Claude skill calls the same steps; if
    you change one, mirror the change in the other two.

.PARAMETER Configuration
    Debug or Release. Defaults to Debug. Selects the dotnet build/publish
    configuration AND the vdproj configuration. The MSI lands in
    .\<Configuration>\Optosense.Edm.Setup-<NEW_VER>.msi.

.PARAMETER SkipPluginRebuild
    Skip steps 2 and 3 (EF bundles + plugin builds). Useful when only the
    installer custom-action code or vdproj has changed. Cuts ~5 min off
    iteration time but is unsafe if any C#/SPA source changed.

.EXAMPLE
    .\Build-EdmSetup.ps1
    Builds a Debug MSI with the next patch version (e.g. 1.13.14 -> 1.13.15).

.EXAMPLE
    .\Build-EdmSetup.ps1 -Configuration Release
    Builds a Release MSI.

.EXAMPLE
    .\Build-EdmSetup.ps1 -SkipPluginRebuild
    Faster rebuild that reuses the last plugin DLLs and EF bundles. Only
    rebuilds WebApi, the installer EXE, and the MSI itself.

.NOTES
    Requirements:
      - Visual Studio 2026 (VS 18) Community or higher with the
        "Microsoft Visual Studio Installer Projects" extension. VS 2022
        cannot target .NET 10, so devenv 18 is mandatory.
      - .NET 10 SDK (10.0.6 or newer) on PATH.
      - Node.js with npm on PATH (for plugin SPA builds).
      - Run as a regular user; the MSI itself needs admin to install but
        the build does not.

    Per-plugin version state is persisted at
    <repo>\.claude\build-edm-setup-state.json (gitignored). Schema:
        { "<csproj-name>": { "hash": "<sha256>", "version": "1.0.0.<n>" } }
    A plugin's FileVersion is bumped only when the SHA256 of its source
    tree (excluding bin/, obj/, node_modules/, dist/, build/) differs
    from the recorded hash.
#>

[CmdletBinding()]
param(
    [ValidateSet('Debug', 'Release')]
    [string]$Configuration = 'Debug',

    [switch]$SkipPluginRebuild
)

$ErrorActionPreference = 'Stop'

# ---------------------------------------------------------------------------
# Path setup. The script lives in <repo>\Optosense.Edm.Setup\, so the repo
# root is one level up. Resolve here so the rest of the script can use
# absolute paths regardless of the user's working directory.
# ---------------------------------------------------------------------------
$SetupDir  = $PSScriptRoot
$RepoRoot  = (Resolve-Path "$SetupDir\..").Path
$Vdproj    = Join-Path $SetupDir 'Optosense.Edm.Setup.vdproj'
$StateFile = Join-Path $RepoRoot '.claude\build-edm-setup-state.json'
$DevEnv    = 'C:\Program Files\Microsoft Visual Studio\18\Community\Common7\IDE\devenv.com'

if (-not (Test-Path $Vdproj))  { throw "vdproj not found: $Vdproj" }
if (-not (Test-Path $DevEnv))  { throw "devenv 18 not found: $DevEnv. Install Visual Studio 2026 Community + Microsoft Visual Studio Installer Projects." }

function Write-Step {
    param([string]$Title)
    Write-Host ""
    Write-Host "===== $Title =====" -ForegroundColor Cyan
}

# ---------------------------------------------------------------------------
# STEP 1 - Bump ProductVersion + regenerate ProductCode in the vdproj.
#
# WHY: a major upgrade requires (a) a strictly greater ProductVersion AND
# (b) a fresh ProductCode GUID. Without both, msiexec /i over an existing
# install fails with "Another version of this product is already installed"
# and RemoveExistingProducts never fires. UpgradeCode (the lineage GUID) is
# left alone -- that is what ties old and new products together.
#
# WHY OutputFilename gets stamped: each MSI ends up at a unique path
# (Optosense.Edm.Setup-1.13.14.msi, ...-1.13.15.msi, ...) so successive
# builds don't overwrite each other and CI/release archives stay distinct.
#
# vdproj is UTF-8 with BOM. -Encoding UTF8 in Windows PowerShell 5.1
# preserves the BOM; switching to PS Core would change this -- test before
# upgrading the script.
# ---------------------------------------------------------------------------
function Invoke-BumpVersion {
    Write-Step 'STEP 1: bump ProductVersion + regenerate ProductCode'
    $c = Get-Content $Vdproj -Raw
    if ($c -notmatch '"ProductVersion" = "8:(\d+)\.(\d+)\.(\d+)"') {
        throw "ProductVersion not found in $Vdproj"
    }
    $newVer  = "$($matches[1]).$($matches[2]).$([int]$matches[3] + 1)"
    $newCode = [guid]::NewGuid().ToString().ToUpper()

    $c = $c -replace '"ProductCode" = "8:\{[0-9A-Fa-f-]+\}"',                                              "`"ProductCode`" = `"8:{$newCode}`""
    $c = $c -replace '"ProductVersion" = "8:[\d.]+"',                                                     "`"ProductVersion`" = `"8:$newVer`""
    $c = $c -replace '"OutputFilename" = "8:Debug\\\\Optosense\.Edm\.Setup(?:-[\d.]+)?\.msi"',            "`"OutputFilename`" = `"8:Debug\\Optosense.Edm.Setup-$newVer.msi`""
    $c = $c -replace '"OutputFilename" = "8:Release\\\\Optosense\.Edm\.Setup(?:-[\d.]+)?\.msi"',          "`"OutputFilename`" = `"8:Release\\Optosense.Edm.Setup-$newVer.msi`""
    Set-Content $Vdproj -Value $c -Encoding UTF8 -NoNewline

    Write-Host "Bumped to $newVer, ProductCode {$newCode}" -ForegroundColor Green
    return $newVer
}

# ---------------------------------------------------------------------------
# STEP 2 - Build the EF migration bundles (.efbundle.exe).
#
# WHY: the MSI ships self-contained migration bundles next to WebApi.exe.
# At install time the custom-action runs them with --connection <db> so the
# target DB is brought up to the schema this MSI expects. Each bundle reads
# __EFMigrationsHistory and applies only the missing migrations, so it is
# idempotent.
#
# WHY before step 3: 'dotnet ef migrations bundle' rebuilds the Logistics
# csproj as a side effect WITHOUT our /p:FileVersion. If step 3 ran first,
# this rebuild would silently revert the Logistics FileVersion to default,
# undoing the bump. Running EF bundles first means step 3 is the LAST thing
# to touch plugin DLLs and the bumped version survives all the way to
# vdproj packaging.
# ---------------------------------------------------------------------------
function Invoke-BuildBundles {
    Write-Step 'STEP 2: build EF migration bundles'
    $bat = Join-Path $SetupDir 'build-bundles.bat'
    cmd.exe /c $bat
    if ($LASTEXITCODE -ne 0) { throw "build-bundles.bat failed with exit $LASTEXITCODE" }
}

# ---------------------------------------------------------------------------
# STEP 3 - Rebuild plugin SPAs and DLLs, bumping FileVersion only when the
# plugin's source tree changed since the last successful build.
#
# WHY plugins need explicit rebuilding: plugin csprojs embed their React
# build output (Ui/dist or ClientApp/build) as resources. They are MEF-
# loaded at runtime, so they are NOT in WebApi's project-reference graph;
# neither 'dotnet publish Optosense.Edm.WebApi' nor the devenv Setup build
# rebuilds them. Without this step the MSI ships whatever DLL was last
# produced manually -- UI changes silently don't reach end users.
#
# WHY FileVersion needs to bump: if the user ever reverts the REP-at-1399
# patch in step 8, MSI Component Rules would refuse to overwrite plugin
# DLLs whose FileVersion equals the already-installed copy. Bumping
# FileVersion only when sources actually changed makes upgrades reliable
# without introducing spurious bumps that clutter MSI deltas.
#
# WHY ONLY FileVersion -- never AssemblyVersion / Version: AssemblyVersion
# cascades through <ProjectReference> chains. A plugin build with
# /p:AssemblyVersion=X also rebuilds shared Optosense.Edm.Core.dll,
# Domain.dll, etc. into the plugin's bin folder at version X. WebApi is
# published in step 4 WITHOUT this property, so its embedded copies of
# those shared DLLs stay at 1.0.0.0. At runtime
# OptosenseLoadContext.Load matches shared assemblies by full
# AssemblyName.FullName (Name+Version+Culture+Key), so the plugin's
# request for "Optosense.Edm.Core, Version=X" against a default-ALC
# "Version=1.0.0.0" returns null -- ReflectionTypeLoadException, plugin
# fails to load. FileVersion is metadata only and doesn't affect binding.
#
# WHY npm.cmd, not npm: 'npm' on PATH resolves to npm.ps1, which the
# default Windows ExecutionPolicy blocks. The resulting PSSecurityException
# does NOT set $LASTEXITCODE, so a naive `if ($LASTEXITCODE) { throw }`
# silently passes through with stale dist/ embedded in the DLL.
# ---------------------------------------------------------------------------
function Get-PluginFingerprint {
    param([string]$Root)
    $exclude = '\\(bin|obj|node_modules|\.cache|dist|build)\\'
    $files = Get-ChildItem $Root -Recurse -File -Force |
        Where-Object { $_.FullName -notmatch $exclude } |
        Sort-Object FullName
    $sb = [System.Text.StringBuilder]::new()
    foreach ($f in $files) {
        $rel = $f.FullName.Substring($Root.Length + 1)
        $h   = (Get-FileHash $f.FullName -Algorithm SHA256).Hash
        [void]$sb.AppendLine("${rel}:${h}")
    }
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($sb.ToString())
    $sha   = [System.Security.Cryptography.SHA256]::Create()
    return ([BitConverter]::ToString($sha.ComputeHash($bytes)) -replace '-','')
}

function Get-NextRevision {
    param([string]$Version)
    $parts = $Version -split '\.'
    while ($parts.Count -lt 4) { $parts += '0' }
    $parts[3] = [string]([int]$parts[3] + 1)
    return ($parts -join '.')
}

function Invoke-BuildPlugins {
    Write-Step 'STEP 3: rebuild plugin SPAs + DLLs (FileVersion-only)'

    # SPA-embedding plugins. Append new ones here when added to the solution.
    $plugins = @(
        @{ name = 'Microprojects.Edm.Ui.Logistics';    ui = 'Ui' },
        @{ name = 'Microprojects.Edm.Ui.Console';      ui = 'Ui' },
        @{ name = 'Microprojects.Edm.Ui.Technologies'; ui = 'Ui' },
        @{ name = 'Optosense.Edm.Plugins.Operator';    ui = 'Ui' },
        @{ name = 'Optosense.Edm.Profiles.Board';      ui = 'Ui' },
        @{ name = 'Optosense.Edm.Operations.Optogen';  ui = 'Ui' },
        @{ name = 'Optosense.Edm.Drivers.Null';        ui = 'Ui' }
    )

    $state = @{}
    if (Test-Path $StateFile) {
        (Get-Content $StateFile -Raw | ConvertFrom-Json).PSObject.Properties | ForEach-Object {
            $state[$_.Name] = @{ hash = $_.Value.hash; version = $_.Value.version }
        }
    }

    foreach ($p in $plugins) {
        $root = Join-Path $RepoRoot $p.name
        Write-Host "--- $($p.name) ---" -ForegroundColor Cyan

        Push-Location (Join-Path $root $p.ui)
        try {
            & npm.cmd run build
            if ($LASTEXITCODE -ne 0) { throw "npm run build failed for $($p.name)" }
        } finally { Pop-Location }

        $newHash = Get-PluginFingerprint $root
        if ($state.ContainsKey($p.name) -and $state[$p.name].hash -eq $newHash) {
            $version = $state[$p.name].version
            Write-Host "  unchanged: keeping FileVersion $version" -ForegroundColor DarkGray
        } else {
            $base    = if ($state.ContainsKey($p.name)) { $state[$p.name].version } else { '1.0.0.0' }
            $version = Get-NextRevision $base
            $state[$p.name] = @{ hash = $newHash; version = $version }
            Write-Host "  changed: bumped FileVersion to $version" -ForegroundColor Yellow
        }

        & dotnet build (Join-Path $root "$($p.name).csproj") -c $Configuration "/p:FileVersion=$version"
        if ($LASTEXITCODE -ne 0) { throw "dotnet build failed for $($p.name)" }
    }

    # Persist the updated state. Saving here (rather than at the end of the
    # whole script) means: if a later step fails, the next run sees the same
    # hashes -> keeps the already-bumped version -> no version drift, no
    # double-bump.
    $state | ConvertTo-Json -Depth 5 | Set-Content $StateFile -Encoding UTF8
}

# ---------------------------------------------------------------------------
# STEP 4 - Publish the WebApi single-file EXE.
#
# WHY a single-file publish: the vdproj's "Primary Output" item picks up
# the publish folder as one EXE plus a small set of native assets (SNI.dll,
# config files). All managed dependencies (Optosense.Edm.Core, Domain,
# Infrastructure, etc.) are embedded inside the EXE.
# ---------------------------------------------------------------------------
function Invoke-PublishWebApi {
    Write-Step 'STEP 4: publish Optosense.Edm.WebApi (single-file)'
    & dotnet publish (Join-Path $RepoRoot 'Optosense.Edm.WebApi\Optosense.Edm.WebApi.csproj') -c $Configuration
    if ($LASTEXITCODE -ne 0) { throw "dotnet publish WebApi failed with exit $LASTEXITCODE" }
}

# ---------------------------------------------------------------------------
# STEP 5 - Publish the installer custom-action EXE.
#
# WHY: Microprojects.Edm.Install.exe runs at MSI Install/Uninstall time.
# It registers the Windows service, writes appsettings, restores the
# service Environment registry value across upgrades, and applies EF
# migrations via the bundles from step 2. The vdproj packages the publish
# output of this csproj as a separate file under the install dir.
# ---------------------------------------------------------------------------
function Invoke-PublishInstaller {
    Write-Step 'STEP 5: publish Microprojects.Edm.Install (custom-action EXE)'
    & dotnet publish (Join-Path $RepoRoot 'Microprojects.Edm.Install\Microprojects.Edm.Install.csproj') -c $Configuration
    if ($LASTEXITCODE -ne 0) { throw "dotnet publish Install failed with exit $LASTEXITCODE" }
}

# ---------------------------------------------------------------------------
# STEP 6 - Clear stale bootstrapper outputs.
#
# WHY: devenv occasionally fails with the intermittent
#   error 8007006E: Unable to finish updating resource for ... setup.exe
# when patching resources of an existing setup.exe stub left in a bad
# state by a prior aborted build. Removing setup.exe and *.tmp lets the
# next devenv invocation regenerate them cleanly.
# ---------------------------------------------------------------------------
function Invoke-ClearBootstrapper {
    Write-Step "STEP 6: clear stale bootstrapper outputs in $Configuration\"
    Remove-Item (Join-Path $SetupDir "$Configuration\*.tmp")    -Force -ErrorAction SilentlyContinue
    Remove-Item (Join-Path $SetupDir "$Configuration\setup.exe") -Force -ErrorAction SilentlyContinue
}

# ---------------------------------------------------------------------------
# STEP 7 - Build the Setup vdproj with devenv.com.
#
# WHY devenv (not msbuild): only Visual Studio understands .vdproj. msbuild
# rejects it.
# WHY VS 18: vdproj inherits the targeted runtime from the Setup project
# entries and Optosense.Edm.WebApi targets net10.0. VS 2022 (17) does not
# ship .NET 10 targeting packs.
# WHY /ProjectConfig: the solution-level Debug config excludes the Setup
# project (vdproj builds are slow and unwanted on every dev F5). Without
# /ProjectConfig devenv reports "Skipped Build: Project: Optosense.Edm.Setup"
# and silently exits with code 0 -- check for "Packaging file" lines in
# stdout to confirm the project actually built.
# ---------------------------------------------------------------------------
function Invoke-BuildVdproj {
    Write-Step "STEP 7: build Setup vdproj with devenv 18 ($Configuration)"
    & $DevEnv (Join-Path $RepoRoot 'Edm.slnx') /Build "$Configuration|Any CPU" /Project 'Optosense.Edm.Setup\Optosense.Edm.Setup.vdproj' /ProjectConfig $Configuration
    if ($LASTEXITCODE -ne 0) { throw "devenv build failed with exit $LASTEXITCODE" }
}

# ---------------------------------------------------------------------------
# STEP 8 - Patch the MSI:
#   (a) add a CustomAction that stops the edm service synchronously,
#   (b) re-sequence RemoveExistingProducts to 1399 (before InstallValidate),
#   (c) regenerate the PackageCode summary stream.
#
# WHY (a) -- a NEW custom action even with REP early: REP triggers a
# nested uninstall of the PREVIOUSLY-installed product, which runs the
# OLD Install.exe's /Uninstall code. Any improvement to that EXE only
# takes effect one upgrade later. The new MSI itself running 'net stop
# edm /y' (synchronous) at sequence 1300 breaks the chicken-and-egg.
# Type 50 (EXE-from-property) is used because Type 38 (inline VBScript
# with WScript.Shell.Run) silently produces an empty trace file in the
# MSI inline VBS host. Type 114 = 50 + 64 (Continue) so a non-zero exit
# (e.g. 1060 "service not installed" on a clean install) doesn't fail
# the install.
#
# WHY (b) -- REP at 1399, not the VS-default 6650: REP late means the old
# 'edm' service registry entry is still alive when InstallFiles runs, so
# the new Install.exe's 'sc create edm' fails ("name in use"). Plus
# Component Rules then refuse to overwrite plugin DLLs whose FileVersion
# matches the installed copy. Placing REP at 1399 (just before
# InstallValidate at 1400) deletes the old product entirely first;
# InstallFiles then writes fresh files and the service is created cleanly.
# Microsoft's documented placement (between InstallValidate and
# InstallInitialize) doesn't help here because InstallValidate's Restart
# Manager scan would still see the old service holding files.
#
# WHY (c): PackageCode (Summary Information property 9) identifies the
# specific bytes of the MSI. We modify those bytes after devenv writes
# them, so the original PackageCode is stale. A cached LocalPackage in
# %WINDIR%\Installer\ matching the old PackageCode would otherwise be
# served by Windows Installer on subsequent operations, ignoring our
# patches.
#
# WHY InvokeMember: Windows Installer's COM API is late-bound. PowerShell's
# COM adapter can't resolve overloaded methods like CreateRecord(int) and
# the View object's Close() reliably; explicit InvokeMember calls work
# around this.
# ---------------------------------------------------------------------------
function Invoke-PatchMsi {
    param([string]$Version)
    Write-Step "STEP 8: patch MSI (stop-service CA + REP at 1399 + fresh PackageCode)"

    $msi = Join-Path $SetupDir "$Configuration\Optosense.Edm.Setup-$Version.msi"
    if (-not (Test-Path $msi)) { throw "MSI not produced: $msi" }

    Write-Host "  MSI: $msi (size $((Get-Item $msi).Length) bytes)" -ForegroundColor DarkGray

    # WHY out-of-process: every InvokeMember on the WindowsInstaller COM API
    # raises DISP_E_TYPEMISMATCH (HRESULT 0x80020005) when called from the
    # same PowerShell process that just hosted devenv as a child (step 7).
    # The very first call -- OpenDatabase -- already throws, even with
    # multi-second waits and explicit retries. The same code in a fresh
    # powershell.exe against the SAME MSI succeeds immediately. Some
    # process-level state pollution by devenv (or by the dotnet/MSBuild
    # subprocesses) makes the late-bound dispatch unusable for the rest of
    # the parent process's lifetime. Spawning a fresh child process for
    # step 8 sidesteps it entirely.
    #
    # The child writes one line "PackageCode={GUID}" to stdout on success
    # so the parent can include the value in the build summary.
    $patchScript = @'
param([string]$MsiPath)
$ErrorActionPreference = 'Stop'

$installer = New-Object -ComObject WindowsInstaller.Installer
# OpenDatabase mode 1 = transact (read-write).
$db = $installer.GetType().InvokeMember('OpenDatabase', 'InvokeMethod', $null, $installer, @($MsiPath, 1))

function Exec-Sql {
    param($Database, [string]$Sql)
    Write-Host "  sql: $Sql" -ForegroundColor DarkGray
    $v = $Database.GetType().InvokeMember('OpenView', 'InvokeMethod', $null, $Database, @($Sql))
    $v.GetType().InvokeMember('Execute', 'InvokeMethod', $null, $v, @()) | Out-Null
}

# (a) Property holding cmd.exe path -- referenced by the CA Source.
Exec-Sql $db "DELETE FROM Property WHERE Property='SVC_STOP_CMD'"
Exec-Sql $db "INSERT INTO Property (Property,Value) VALUES ('SVC_STOP_CMD','C:\Windows\System32\cmd.exe')"

# Property MSIRMSHUTDOWN=2 -- the real fix for "EDM Service is using files".
# Why: our StopEdm CA below is IMMEDIATE (Type 114). MSI runs immediate CAs in
# InstallExecuteSequence as the launching user, NOT as LocalSystem -- only
# deferred+NoImpersonate CAs are elevated. So `net stop edm /y` from sequence
# 1300 fails with access-denied and the service is still running when
# InstallValidate (1400) does its Restart Manager scan, triggering the
# FilesInUse dialog. Setting MSIRMSHUTDOWN=2 tells MSI's RM integration to
# silently shut down apps/services holding files instead of prompting; RM
# itself runs server-side (elevated) and CAN stop the service via SCM.
# We still keep the StopEdm CA for trace logging and as belt-and-suspenders.
Exec-Sql $db "DELETE FROM Property WHERE Property='MSIRMSHUTDOWN'"
Exec-Sql $db "INSERT INTO Property (Property,Value) VALUES ('MSIRMSHUTDOWN','2')"

# CustomAction Type 114 = 50 (EXE from property) + 64 (Continue on non-zero exit).
# `mkdir "[TARGETDIR]."` ensures the install dir exists at sequence 1300,
# before MSI's CreateFolders. The "." form avoids the cmd-quoting pitfall
# where a path ending in `\"` can be misread as an escaped quote.
#
# DO NOT use `^&` to separate commands inside the parenthesised group:
# in cmd parsing `^&` is the ESCAPED form, i.e. a literal `&` character,
# NOT a command separator. With `^&` the entire group becomes a single
# echo whose argument contains the literal text "& net stop edm /y";
# net stop never runs and InstallValidate (1400) still sees the service
# holding files. Plain `&` is correct here -- it separates commands
# within the group, and the group's combined output is redirected by
# the `>>` after the closing paren.
#
# `taskkill /F` is a belt-and-suspenders safety: `net stop edm /y` blocks
# until SCM reports SERVICE_STOPPED, but the underlying process can
# remain alive briefly while finalisers run, leaving file handles
# locked. /T also kills child processes if any.
Exec-Sql $db "DELETE FROM CustomAction WHERE Action='StopEdmServiceBeforeInstall'"
$tgt = '/c mkdir "[TARGETDIR]." 2>nul & (echo === %DATE% %TIME% StopEdm CA fired === & net stop edm /y & taskkill /F /IM Optosense.Edm.WebApi.exe /T) >> "[TARGETDIR]edm-stop-trace.txt" 2>&1'
Exec-Sql $db "INSERT INTO CustomAction (Action,Type,Source,Target) VALUES ('StopEdmServiceBeforeInstall',114,'SVC_STOP_CMD','$tgt')"

# (b) Schedule StopEdm at 1300, REP at 1399 (before InstallValidate at 1400).
Exec-Sql $db "DELETE FROM InstallExecuteSequence WHERE Action='StopEdmServiceBeforeInstall'"
Exec-Sql $db "INSERT INTO InstallExecuteSequence (Action,Condition,Sequence) VALUES ('StopEdmServiceBeforeInstall','',1300)"
Exec-Sql $db "UPDATE InstallExecuteSequence SET Sequence=1399 WHERE Action='RemoveExistingProducts'"

# (c) Regenerate PackageCode BEFORE db.Commit. The Summary Information stream
# lives inside the same OLE compound file as the database tables;
# SummaryInfo.Persist() only stages the write in the open handle, only
# db.Commit() flushes the compound file. Commit-then-Persist silently drops
# the summary write -- verified empirically.
#
# Use BindingFlags 'PutDispProperty' (DISPATCH_PROPERTYPUT). The generic
# 'SetProperty' raises DISP_E_TYPEMISMATCH on PS 5.1 for the indexed put,
# and `$si.Property(9) = $val` (high-level accessor) does an in-memory put
# that Persist never propagates.
Write-Host "  open summary information (writable=1)" -ForegroundColor DarkGray
$si = $db.SummaryInformation(1)
$newPkgCode = "{$([guid]::NewGuid().ToString().ToUpper())}"
Write-Host "  set Property(9) = $newPkgCode" -ForegroundColor DarkGray
$si.GetType().InvokeMember('Property', 'PutDispProperty', $null, $si, @([int]9, [string]$newPkgCode)) | Out-Null
Write-Host "  persist summary information" -ForegroundColor DarkGray
$si.Persist()

Write-Host "  commit database" -ForegroundColor DarkGray
$db.GetType().InvokeMember('Commit', 'InvokeMethod', $null, $db, @()) | Out-Null

[System.Runtime.InteropServices.Marshal]::ReleaseComObject($si)        | Out-Null
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($db)        | Out-Null
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($installer) | Out-Null
[GC]::Collect(); [GC]::WaitForPendingFinalizers()

# Marker line consumed by the parent process.
"PackageCode=$newPkgCode"
'@

    $tempScript = Join-Path $env:TEMP "Patch-EdmMsi-$([guid]::NewGuid()).ps1"
    Set-Content -Path $tempScript -Value $patchScript -Encoding UTF8
    try {
        Write-Host "  invoking patcher in fresh powershell.exe ($tempScript)" -ForegroundColor DarkGray
        $childOutput = & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $tempScript -MsiPath $msi
        if ($LASTEXITCODE -ne 0) {
            Write-Host ($childOutput | Out-String) -ForegroundColor Red
            throw "Patch child process failed with exit $LASTEXITCODE"
        }
        # Echo child output (already includes "  sql: ..." traces) so the
        # parent transcript stays informative.
        $childOutput | ForEach-Object { Write-Host $_ }
        $pkgLine = $childOutput | Where-Object { $_ -is [string] -and $_ -match '^PackageCode=' } | Select-Object -Last 1
        if (-not $pkgLine) { throw "Patch child produced no PackageCode line. Full output above." }
        $newPkgCode = ($pkgLine -replace '^PackageCode=', '')
    } finally {
        Remove-Item $tempScript -Force -ErrorAction SilentlyContinue
    }

    Write-Host "Patched: Type 50 CA via SVC_STOP_CMD -> cmd.exe -> net stop edm /y" -ForegroundColor Green
    Write-Host "PackageCode -> $newPkgCode"                                          -ForegroundColor Green
    return $newPkgCode
}

# ---------------------------------------------------------------------------
# Main pipeline.
# ---------------------------------------------------------------------------
$started = Get-Date
$newVer  = Invoke-BumpVersion

if (-not $SkipPluginRebuild) {
    Invoke-BuildBundles
    Invoke-BuildPlugins
} else {
    Write-Host "Skipping STEP 2-3 (plugin rebuild) per -SkipPluginRebuild." -ForegroundColor Yellow
}

Invoke-PublishWebApi
Invoke-PublishInstaller
Invoke-ClearBootstrapper
Invoke-BuildVdproj
$pkgCode = Invoke-PatchMsi -Version $newVer

$msi = Join-Path $SetupDir "$Configuration\Optosense.Edm.Setup-$newVer.msi"
$elapsed = (Get-Date) - $started

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "Build succeeded in $([int]$elapsed.TotalMinutes)m $($elapsed.Seconds)s" -ForegroundColor Green
Write-Host "  MSI:         $msi"
Write-Host "  Size:        $([math]::Round((Get-Item $msi).Length / 1MB, 2)) MB"
Write-Host "  Version:     $newVer"
Write-Host "  PackageCode: $pkgCode"
Write-Host "============================================================" -ForegroundColor Green
