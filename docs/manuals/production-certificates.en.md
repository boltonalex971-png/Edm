# EDM Production Certificate Setup — Admin Manual

This document describes how to provision the X.509 certificates that EDM uses for mutual-TLS between hosts. Follow it before the first install on a new site, and again whenever a host's cert is approaching expiry.

For the architectural background — why mTLS, which scheme handles which traffic, what the allow-list does — see `docs/specs/auth-implementation-spec.md`.

---

## 1. Trust model recap

Every EDM host on a site presents a server cert on `GrpcSecure` (default `:16334`) and uses the same cert as a client cert when calling other hosts (master IntercomHub subscribe, peer gRPC). The server-side `Certificate` handler accepts a connection only when the presented cert's CN (or full Subject DN) is on the host's `Edm:Auth:RemoteServices` allow-list, plus the host of `Edm:Intercom:Principal` (auto-trusted).

Each host therefore needs:

| Store                      | Cert                                     | Purpose                              |
|----------------------------|------------------------------------------|--------------------------------------|
| `LocalMachine\Root`        | Site CA public cert                      | Trust anchor for chain validation    |
| `LocalMachine\My`          | Per-host end-entity cert (`CN=<hostname>`) | Server cert + outbound client cert |

The site CA's private key lives **only on the issuing workstation**, not on EDM hosts. EDM hosts only need the CA's public cert.

Convention: each host's cert CN equals its DNS hostname. The Principal URL is built from that name. So the operator only configures `Principal` once per peer host; the principal-host's CN is auto-trusted.

---

## 2. Prerequisites

- An admin Windows workstation with PowerShell 5.1 or later. This is where you generate the CA and issue end-entity certs.
- Local administrator on every EDM host (cert installation, key ACL, service restart).
- DNS hostnames for all EDM hosts in the site, fixed and resolvable from every other host.
- The Windows account that runs the `EDM Service` on each host. Default for MSI install: `LocalSystem`. For domain-joined hosts using a service account, know its `DOMAIN\user` form.

---

## 3. One-time site setup — issue the CA

Run **once per site**, on the admin workstation, in an elevated PowerShell. The CA's private key stays on this workstation; back it up off-site.

```powershell
$ca = New-SelfSignedCertificate `
    -Subject "CN=EDM Site CA" `
    -KeyUsage CertSign, CRLSign, DigitalSignature `
    -KeyAlgorithm RSA -KeyLength 4096 -HashAlgorithm SHA256 `
    -Provider "Microsoft Software Key Storage Provider" `
    -KeyExportPolicy Exportable `
    -CertStoreLocation "Cert:\LocalMachine\My" `
    -NotAfter (Get-Date).AddYears(20)

# Export the CA private key (PFX) for backup. Store the password in your secrets vault.
$pwd = Read-Host -AsSecureString "CA PFX password"
Export-PfxCertificate -Cert $ca -FilePath "C:\edm-pki\edm-site-ca.pfx" -Password $pwd | Out-Null

# Export the CA public certificate (CER) for distribution to every host.
Export-Certificate -Cert $ca -FilePath "C:\edm-pki\edm-site-ca.cer" | Out-Null

"CA thumbprint: $($ca.Thumbprint)"
```

Outputs:
- `edm-site-ca.pfx` — back up to a secure off-site location.
- `edm-site-ca.cer` — copy to each EDM host.

---

## 4. Per-host setup

Repeat the following for **every EDM host** in the site (admin and peers alike).

### 4.1 Install the site CA into the host's Root store

On the EDM host, run elevated:

```powershell
Import-Certificate -FilePath "\\share\edm-pki\edm-site-ca.cer" -CertStoreLocation Cert:\LocalMachine\Root
```

Verify:

```powershell
Get-ChildItem Cert:\LocalMachine\Root | Where-Object Subject -eq 'CN=EDM Site CA'
```

### 4.2 Issue the host's end-entity cert

Choose one of the two options below.

**Option A — issue from the admin workstation, deliver as PFX.** Recommended when CA private key is centralized.

On the admin workstation (elevated):

```powershell
$ca = Get-ChildItem Cert:\LocalMachine\My | Where-Object Subject -eq 'CN=EDM Site CA'

# Replace with the target host's DNS name
$hostName = 'edm-host-01.contoso.local'

$cert = New-SelfSignedCertificate `
    -Subject "CN=$hostName" `
    -DnsName $hostName, $hostName.Split('.')[0] `
    -Signer $ca `
    -KeyAlgorithm RSA -KeyLength 2048 -HashAlgorithm SHA256 `
    -Provider "Microsoft Software Key Storage Provider" `
    -KeyExportPolicy Exportable `
    -KeyUsage DigitalSignature, KeyEncipherment `
    -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.1,1.3.6.1.5.5.7.3.2") `
    -CertStoreLocation "Cert:\LocalMachine\My" `
    -NotAfter (Get-Date).AddYears(2)

$pwd = Read-Host -AsSecureString "PFX password for $hostName"
Export-PfxCertificate -Cert $cert -FilePath "C:\edm-pki\$hostName.pfx" -Password $pwd | Out-Null

# Remove the temporary copy from the admin workstation's My store; the CA stays.
Remove-Item -Path "Cert:\LocalMachine\My\$($cert.Thumbprint)" -Force
"Issued cert thumbprint: $($cert.Thumbprint)"
```

Then on the target EDM host (elevated):

```powershell
$pwd = Read-Host -AsSecureString "PFX password"
Import-PfxCertificate -FilePath "\\share\edm-pki\edm-host-01.contoso.local.pfx" `
    -CertStoreLocation Cert:\LocalMachine\My `
    -Password $pwd `
    -Exportable
```

**Option B — issue locally on the EDM host.** Use only when the CA PFX is securely available on that host (e.g. a small single-host pilot).

On the EDM host (elevated):

```powershell
$pwd = Read-Host -AsSecureString "CA PFX password"
$ca = Import-PfxCertificate -FilePath "\\share\edm-pki\edm-site-ca.pfx" `
    -CertStoreLocation Cert:\LocalMachine\My -Password $pwd -Exportable

$hostName = $env:COMPUTERNAME  # or fully-qualified DNS name
$cert = New-SelfSignedCertificate `
    -Subject "CN=$hostName" `
    -DnsName $hostName `
    -Signer $ca `
    -KeyAlgorithm RSA -KeyLength 2048 -HashAlgorithm SHA256 `
    -Provider "Microsoft Software Key Storage Provider" `
    -KeyExportPolicy Exportable `
    -KeyUsage DigitalSignature, KeyEncipherment `
    -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.1,1.3.6.1.5.5.7.3.2") `
    -CertStoreLocation "Cert:\LocalMachine\My" `
    -NotAfter (Get-Date).AddYears(2)

# Remove the CA from the host's My store — it should not live here in steady state.
Remove-Item -Path "Cert:\LocalMachine\My\$($ca.Thumbprint)" -Force
"Issued cert thumbprint: $($cert.Thumbprint)"
```

### 4.3 Verify EKUs

The end-entity cert **must** carry both Server Authentication and Client Authentication EKUs. Without Client Auth, the EDM service can't authenticate to other hosts.

```powershell
$cert = Get-ChildItem Cert:\LocalMachine\My | Where-Object Subject -eq "CN=$env:COMPUTERNAME"
($cert.Extensions | Where-Object { $_.Oid.Value -eq '2.5.29.37' }).EnhancedKeyUsages |
    ForEach-Object { "$($_.FriendlyName) ($($_.Value))" }
```

Expected output (both lines must be present):

```
Server Authentication (1.3.6.1.5.5.7.3.1)
Client Authentication (1.3.6.1.5.5.7.3.2)
```

### 4.4 Grant the EDM service account Read on the private key

CNG private keys default to `SYSTEM + Administrators` only. If the EDM service runs under any other account, it cannot read the key, Kestrel cannot present the server cert, and TLS aborts with "EOF or 0 bytes from the transport stream."

```powershell
$thumb = $cert.Thumbprint
$out = certutil -store My $thumb
$keyName = (($out | Select-String 'Unique container name') -replace '.*:\s*', '').Trim()
$keyPath = Join-Path "$env:ProgramData\Microsoft\Crypto\Keys" $keyName

# Service account: 'NT AUTHORITY\SYSTEM' for default MSI install,
#                  'DOMAIN\svc-edm$' for a domain-joined service account, etc.
$serviceAccount = 'NT AUTHORITY\SYSTEM'
icacls $keyPath /grant ($serviceAccount + ':(R)')
```

Skip this step only when the EDM service runs as `LocalSystem` (member of Administrators by default).

### 4.5 Configure `appsettings.json` on the host

Edit `appsettings.json` (or `appsettings.Production.json`) at the EDM install path. The MSI installer normally writes most of these from token replacements, so usually only `Edm:Auth:RemoteServices` and `Edm:Intercom:Principal` need attention.

```json
"Kestrel": {
  "Endpoints": {
    "GrpcSecure": {
      "Url": "https://0.0.0.0:16334",
      "SslProtocols": [ "Tls12", "Tls13" ],
      "Protocols": "Http1AndHttp2",
      "ClientCertificateMode": "AllowCertificate"
    },
    "Https": { "Url": "https://0.0.0.0:16332", "Protocols": "Http1" }
  },
  "Certificates": {
    "Default": {
      "AllowInvalid": true,
      "Location": "LocalMachine",
      "Store": "My",
      "Subject": "edm-host-01.contoso.local"
    }
  }
},
"Edm": {
  "Intercom": {
    "Kind": "SignalR",
    "Principal": "https://edm-admin.contoso.local:16334"
  },
  "Auth": {
    "RemoteServices": [
      "edm-host-01.contoso.local",
      "edm-host-02.contoso.local"
    ]
  }
}
```

Notes:
- `Subject` must match the CN of the host's end-entity cert exactly.
- `Principal` must be the URL of the master IntercomHub — typically the admin host on `:16334`. Its CN is auto-appended to `RemoteServices`, so don't list it again.
- `RemoteServices` lists every **other** peer host that may call this one. The admin host needs all peer driver hosts here; a peer driver host typically needs only the admin host (and that's already covered by the implicit Principal entry).

### 4.6 Restart the EDM service

```powershell
Restart-Service edm
```

Kestrel and `ClientCertificateProvider` both load the cert at startup. A config or cert change requires a service restart.

---

## 5. Verification

On each host, after restart, check the EDM event log under **Microprojects > EDM Service**. Healthy startup shows:

```
Client cert loaded: subject='CN=<hostname>', thumbprint=<...>
Successfully connected to hub channel <name>
```

Mismatch quick reference:

| Symptom in EDM log                                    | Likely cause                                                 |
|-------------------------------------------------------|--------------------------------------------------------------|
| `EOF or 0 bytes from the transport stream`            | Server cert key not readable by service account (§4.4 missed). |
| `RevocationStatusUnknown` from CertificateAuthenticationHandler | CRL endpoint unreachable; this should never happen on a private CA — confirm `RevocationMode=NoCheck` was not removed from `Program.cs`. |
| `Certificate not allowed`                             | Peer cert CN missing from `RemoteServices`, and not the Principal host. |
| `401 Unauthorized` on Hub negotiate                   | Outbound cert lacks Client Authentication EKU (§4.3 missed). |
| `Client cert not found in LocalMachine\My`            | Cert subject mismatch between `Kestrel:Certificates:Default:Subject` and installed cert CN. |

---

## 6. Renewal procedure

End-entity certs in this manual default to **2-year** validity; the CA defaults to **20-year**. Renew end-entity certs at least 30 days before expiry.

For each host whose cert is expiring:

1. Re-run §4.2 with the same hostname (issues a new cert; old one stays in the store until you remove it).
2. Re-run §4.4 to grant the service account Read on the new private key.
3. Optional — remove the old cert:
   ```powershell
   Get-ChildItem Cert:\LocalMachine\My |
       Where-Object { $_.Subject -eq "CN=$hostName" -and $_.NotAfter -lt (Get-Date) } |
       ForEach-Object { Remove-Item -Path $_.PSPath -Force }
   ```
4. `Restart-Service edm`.

The site CA does **not** need rotation for end-entity renewal. CA rotation is a separate, larger procedure: issue a new CA, distribute its public cert to every host's `Root`, re-issue every end-entity cert, then remove the old CA from `Root`.

---

## 7. Backup and recovery

| Asset                          | Where                                    | Backup target          |
|--------------------------------|------------------------------------------|------------------------|
| Site CA private key            | `C:\edm-pki\edm-site-ca.pfx` (admin WS) | Off-site secure vault  |
| Site CA public cert            | `C:\edm-pki\edm-site-ca.cer` (admin WS) | Off-site, plus host install share |
| Per-host end-entity PFXs       | `C:\edm-pki\<hostname>.pfx` (admin WS)  | Optional; can re-issue from CA |

Losing the CA PFX means no new end-entity certs can be issued under the existing trust chain — every host would need a new CA + new end-entity. Treat the CA PFX with the same care as a domain-admin password.
