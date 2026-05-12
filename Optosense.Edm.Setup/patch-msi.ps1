param([string]$Msi, [string]$NewVer)
$ErrorActionPreference = 'Stop'
if (-not (Test-Path $Msi)) { throw "MSI not produced: $Msi" }

$installer = New-Object -ComObject WindowsInstaller.Installer
$db = $installer.GetType().InvokeMember('OpenDatabase', 'InvokeMethod', $null, $installer, @($Msi, 1))

function Exec($db, $sql) {
  $v = $db.GetType().InvokeMember('OpenView', 'InvokeMethod', $null, $db, @($sql))
  $v.GetType().InvokeMember('Execute', 'InvokeMethod', $null, $v, $null) | Out-Null
}

# (a) Property holding cmd.exe path for the Type 50 CA.
Exec $db "DELETE FROM Property WHERE Property='SVC_STOP_CMD'"
Exec $db "INSERT INTO Property (Property,Value) VALUES ('SVC_STOP_CMD','C:\Windows\System32\cmd.exe')"

# MSIRMSHUTDOWN=2 lets Restart Manager (elevated, server-side) shut down the EDM service silently.
Exec $db "DELETE FROM Property WHERE Property='MSIRMSHUTDOWN'"
Exec $db "INSERT INTO Property (Property,Value) VALUES ('MSIRMSHUTDOWN','2')"

# Type 114 = 50 (EXE from property) + 64 (Continue on non-zero). Plain `&` between commands; `^&` would be a literal `&` character.
# `taskkill /F /T` runs after `net stop` to release any handles a finalising process still holds.
Exec $db "DELETE FROM CustomAction WHERE Action='StopEdmServiceBeforeInstall'"
$tgt = '/c mkdir "[TARGETDIR]." 2>nul & (echo === %DATE% %TIME% StopEdm CA fired === & net stop edm /y & taskkill /F /IM Optosense.Edm.WebApi.exe /T) >> "[TARGETDIR]edm-stop-trace.txt" 2>&1'
Exec $db "INSERT INTO CustomAction (Action,Type,Source,Target) VALUES ('StopEdmServiceBeforeInstall',114,'SVC_STOP_CMD','$tgt')"

# StopEdm at 1300, REP at 1399 (before InstallValidate at 1400).
Exec $db "DELETE FROM InstallExecuteSequence WHERE Action='StopEdmServiceBeforeInstall'"
Exec $db "INSERT INTO InstallExecuteSequence (Action,Condition,Sequence) VALUES ('StopEdmServiceBeforeInstall','',1300)"
Exec $db "UPDATE InstallExecuteSequence SET Sequence=1399 WHERE Action='RemoveExistingProducts'"

# Rotate PackageCode (SummaryInformation property 9) BEFORE Commit; PS 5.1 needs PutDispProperty.
$si = $db.SummaryInformation(1)
$newPkgCode = "{$([guid]::NewGuid().ToString().ToUpper())}"
$si.GetType().InvokeMember('Property', 'PutDispProperty', $null, $si, @([int]9, [string]$newPkgCode)) | Out-Null
$si.Persist()

$db.GetType().InvokeMember('Commit', 'InvokeMethod', $null, $db, @()) | Out-Null

[System.Runtime.InteropServices.Marshal]::ReleaseComObject($si) | Out-Null
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($db) | Out-Null
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($installer) | Out-Null
[GC]::Collect(); [GC]::WaitForPendingFinalizers()

"Patched $Msi (version $NewVer): StopEdm CA + REP@1399 + MSIRMSHUTDOWN=2; PackageCode -> $newPkgCode"
