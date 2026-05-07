# EDM Auth Implementation Spec

Single source of truth for how authentication and authorization are wired in `Optosense.Edm.WebApi`. Read this before changing anything under `Optosense.Edm.WebApi/Program.cs` (auth pipeline), `Optosense.Edm.Core.AspNet/Auth/**`, `Optosense.Edm.Core.AspNet/SignalR/**`, `Optosense.Edm.Core/Infrastructure/IClientCertificateProvider.cs`, `Optosense.Edm.Infrastructure/Edm/Jobs/GrpcJobExecutor.cs`, `Optosense.Edm.Infrastructure/Edm/RemoteJobs.cs`, or any `appsettings*.json` `Edm:Auth` / `Edm:Intercom` / `Kestrel:Endpoints` section.

---

## 1. Threat model & callers

Three call shapes share the host process; each has its own auth path:

| Caller                                      | Transport / Port (logical)        | Auth scheme         |
|---------------------------------------------|-----------------------------------|---------------------|
| Browser SPA → REST/SignalR                  | `Https` (e.g. 16332)              | `Negotiate` → JWT cookie |
| Peer EDM host → gRPC `EdmJobService`        | `GrpcSecure` (e.g. 16334), mTLS   | `Certificate`       |
| Peer EDM host (or self) → SignalR `IntercomHub` | `GrpcSecure` (mTLS, HTTP/1.1 upgrade) | `Certificate`   |
| Loopback (same-host service) → SignalR      | any local                         | hub-level loopback bypass |

Only the principal host runs the master `IntercomHub`; every other host *subscribes* to it for lifecycle/parameter events and is *called* over gRPC for `StartDevice`/`Check`/`Stop`. So every peer host is both a client and a server of mTLS.

---

## 2. Endpoint matrix

`Optosense.Edm.WebApi/appsettings.json` defines two Kestrel endpoints:

```json
"Kestrel": {
  "Endpoints": {
    "GrpcSecure": {
      "Url": "[GRPCURL]",
      "SslProtocols": [ "Tls12", "Tls13" ],
      "Protocols": "Http1AndHttp2",
      "ClientCertificateMode": "AllowCertificate"
    },
    "Https": { "Url": "[CONSOLEURL]", "Protocols": "Http1" }
  },
  "Certificates": {
    "Default": { "Location": "LocalMachine", "Store": "My", "Subject": "[HOSTNAME]", "AllowInvalid": true }
  }
}
```

Two things matter:

- **`GrpcSecure.Protocols = Http1AndHttp2`** — gRPC needs HTTP/2; SignalR's WebSocket upgrade needs HTTP/1.1. Both must coexist on the same port so peer-to-peer SignalR rides the same mTLS allow-list as gRPC.
- **`ClientCertificateMode = AllowCertificate`** — Kestrel *requests* but does not *require* a client cert. The auth pipeline rejects connections without one; this avoids surfacing TLS errors and lets the certificate handler emit a clean 401.

The same Kestrel server cert (LocalMachine\My, `Subject = [HOSTNAME]`) is used for outbound calls (see §5).

---

## 3. Server-side: authentication pipeline

`Program.cs` registers a `PolicyScheme` named `SmartAuth` that forwards by request shape and port:

```
Default = SmartAuth ─┬─ Authorization: Bearer …    → JwtBearer
                    ├─ Cookie X-Auth-Token         → JwtBearer
                    ├─ LocalPort == GrpcSecure.Port → Certificate
                    └─ otherwise                    → Negotiate
```

Three real handlers sit behind it:

### 3.1 Negotiate
Stock `AddNegotiate()`. Establishes the Windows identity for the SPA's first hit so the platform can read `WindowsIdentity.Groups` and translate them into roles + divisions.

### 3.2 JwtBearer
- HS256, key/issuer/audience from `Edm:Auth:Jwt`. Key is symmetric and lives in `appsettings.json` — production deployments override it via env vars or `appsettings.{Environment}.json`.
- `MapInboundClaims = false` — claim names stay short (`role`, `name`, `sub`); long URI mapping (`http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role`) would compound across refreshes.
- `OnMessageReceived` falls back to the `X-Auth-Token` cookie when no `Authorization: Bearer …` header is present, so SPA `<img>` / `<a>` / WebSocket clients (which can't set headers) authenticate via cookie.

### 3.3 Certificate
- `AllowedCertificateTypes = All` — accepts both CA-chained and self-signed certs (deployments are intra-LAN with the `[HOSTNAME]` server cert).
- `RevocationMode = NoCheck` — the default `Online` mode hits CRL/OCSP, which private CAs (`Edm Dev CA` in dev, customer-issued CAs in prod) do not publish. Without `NoCheck` the handler rejects every cert with `RevocationStatusUnknown`. The trust boundary is the `RemoteServices` allow-list, not revocation.
- `OnCertificateValidated`:
  1. Reads `Edm:Auth:RemoteServices` (list of allowed CNs / Subject DNs).
  2. **Implicitly** appends both `principalUri.Host` and `CN=principalUri.Host` derived from `Edm:Intercom:Principal`. This is the convention shortcut: each EDM host's cert CN equals its DNS name, and the principal URL is built from that name. So the operator only configures `Principal` once; the principal-host's CN is auto-trusted by every peer (covers the principal's self-subscription too).
  3. Compares the incoming cert's full Subject **and** simple CN against the merged allow-list.
  4. On match: builds a `ClaimsPrincipal` with `ClaimTypes.Role = AuthDefaults.RemoteService` ("RemoteService"). On miss: `context.Fail("Certificate not allowed")`.

### 3.4 Fallback policy
```csharp
options.FallbackPolicy = new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build();
```
Every endpoint requires an authenticated user unless explicitly `[AllowAnonymous]`. `MapGrpcService<EdmJobService>()` and `MapHub<IntercomHub>(...)` do **not** opt out — they ride SmartAuth + the fallback.

Existing `[AllowAnonymous]` controllers (intentional):
- `Microprojects.Edm.Ui.Technologies/Api/SensorsController.cs`
- `Microprojects.Edm.Ui.Technologies/Controllers/MetaController.cs`
- `Microprojects.Edm.Ui.Logistics/Controllers/MetaController.cs`

Adding new ones requires explicit justification.

---

## 4. Server-side: authorization & role model

### 4.1 Claims shape
Issued by `JwtService.GenerateToken`:
- `sub` / `name` — username (Windows identity name, e.g. `DOMAIN\\alice`).
- `Roles` (multi-valued) — every role the user qualifies for, derived from AD group membership matched against `Edm:Auth:Roles` (e.g. `EDMAdmins → Admin`).
- `role` (single-valued) — the *currently active* role. May be the override picked via `PUT /api/auth/user/role`, otherwise the first `Roles` entry.
- `Divisions` (multi-valued) — derived from groups starting with `Edm:Auth:DivisionsRoot` (default `EDMDivisions_`); the prefix is stripped.

For service-to-service traffic (Certificate handler): only `Role = "RemoteService"`, `Name = CN`. No `Roles` / `Divisions` / `sub`.

### 4.2 Active-role enforcement
`RequireRolesAttribute` (in `Optosense.Edm.Core.AspNet/Auth/`) is the project's authorization primitive — **not** stock `[Authorize(Roles = …)]`:

- Stock `[Authorize(Roles = …)]` matches *any* role claim on the identity. EDM models a user as acting in *one* role at a time (an admin who switches to "Operator" should be denied admin endpoints until they switch back).
- `RequireRolesAttribute` resolves the active role by reading `Session["SelectedRole"]` first, then falling back to `role` / `ClaimTypes.Role` / `Roles` claims.
- Default usage in plugins: `[RequireRoles("Operator", "Technologist", "Admin")]` (see Logistics controllers).

`AuthControllerBase.UserInfo` exposes the same resolution to controllers that need to render UI conditionally; it also enforces an Origin-vs-Host CSRF check before returning identity data.

### 4.3 Hub-level gate
`IntercomHub.Subscribe` runs an additional check after the framework's auth:
```csharp
if (Context.User.Identity?.IsAuthenticated != true && !IsInternalConnection())
    throw new HubException("Unauthorized");
```
`IsInternalConnection` returns true if the user has the `RemoteService` role *or* the connection's `RemoteIpAddress` is loopback. The loopback bypass exists for same-host services (e.g. an out-of-process driver host on the same machine) that don't carry a cert but are inherently trusted.

---

## 5. Client-side: outbound mutual-TLS

Two transports must present a client cert whenever the host calls a peer or itself: SignalR (Subscribe → master IntercomHub) and gRPC (StartOperationJob → peer drivers).

### 5.1 Cert ownership
- Interface lives in `Optosense.Edm.Core/Infrastructure/IClientCertificateProvider.cs` — placed in `Core` (not `Core.AspNet`) so `Optosense.Edm.Infrastructure` can depend on it without a layering cycle.
- Implementation: `Optosense.Edm.Core.AspNet/Auth/ClientCertificateProvider.cs` — loads from `LocalMachine\My` by Subject:
  1. Tries `Edm:Intercom:ClientCertificateSubject`.
  2. Falls back to `Kestrel:Certificates:Default:Subject` (defaulted by `EdmHelper.AddOperationIntercom` if the explicit setting is empty).
  3. Returns `null` on any failure — outbound transport then calls anonymously.

This means the *same* server cert that Kestrel serves with is presented as the *client* cert for outbound calls. EKU on the cert must include both `Server Authentication` (1.3.6.1.5.5.7.3.1) and `Client Authentication` (1.3.6.1.5.5.7.3.2); a server-only cert breaks outbound calls silently.

### 5.2 Wiring (gRPC)
`Optosense.Edm.Infrastructure/Edm/Jobs/IGrpcJobExecutor.cs` + `GrpcJobExecutor.cs`:
- Singleton injected via `EdmHelper.AddOperationIntercom`.
- Owns the cert internally; callers pass only `(IJob, host, parameters?)`.
- `CreateChannel` builds an `HttpClientHandler` with the cert when one exists; falls back to plain `GrpcChannel.ForAddress` when none does.

Callers:
- `Optosense.Edm.Infrastructure/Edm/RemoteJobs.cs` — `Execute` / `StartDevice` / `StartTestOperation`.
- `Optosense.Edm.Infrastructure/Edm/Jobs/StartOperationJob.cs` — peer device starts and per-tick `Check`/`Stop` calls.

`StartOperationJob` accepts `IGrpcJobExecutor` via constructor and never touches `X509Certificate2` directly. **Don't reintroduce that coupling** (transport leak into the job-domain code was the explicit refactor goal).

There is also a `LocalJobExecutor.Execute(this IJobContainer, IJob, …)` extension in the same file — it's an *in-process* dispatch, no transport, kept for symmetry. It does not load a cert.

### 5.3 Wiring (SignalR)
`Optosense.Edm.Core.AspNet/SignalR/EdmIntercom.cs`:
- Constructor receives `IClientCertificateProvider`; stores `_clientCertificate`.
- `ConfigureClientCertificate(HttpConnectionOptions)`:
  - Adds the cert to `opts.ClientCertificates` (HTTP transport — `/negotiate`, SSE, long-polling).
  - **And** chains a `WebSocketConfiguration` callback that adds the cert to `ws.ClientCertificates`. SignalR's WebSocket transport ignores the HTTP-level cert collection — both must be configured independently or the server sees no cert on the WS upgrade.
- Applied to **both** the singleton publish `HubConnection` and the per-channel `Subscribe` connection.

---

## 6. Token lifecycle (browser SPAs)

1. SPA hits `/{plugin-uiroot}/index.html`. `PluginManagerHelper.MapSpa` middleware sees the request, confirms the user is a `WindowsIdentity`, calls `IJwtService.GenerateToken(User, Session["SelectedRole"])`, and sets `X-Auth-Token` cookie (`Secure`, `SameSite=Strict`, 10 min).
2. SPA's API calls flow through the same cookie; SmartAuth selector forwards to JwtBearer.
3. Per-request middleware in `Program.cs` (`app.Use(...)`) refreshes the cookie when:
   - Identity is `WindowsIdentity` (kerb pass-through is always fresh), or
   - JWT `exp` is within `Edm:Auth:Jwt:RefreshThresholdMinutes` (default 15) of expiry. The new token is set as a 60-min cookie.
4. Role switching: `PUT /api/auth/user/role` validates the requested role is in `UserInfo.Roles`, regenerates the JWT with `role = override`, writes both `Session["SelectedRole"]` and a fresh cookie. From this point `RequireRolesAttribute.ResolveActiveRole` returns the new role on every request.

---

## 7. Configuration surface

| Key                                          | Purpose                                                                                         |
|----------------------------------------------|-------------------------------------------------------------------------------------------------|
| `Kestrel:Endpoints:GrpcSecure.Url`           | mTLS port. Must allow `Http1AndHttp2`.                                                          |
| `Kestrel:Endpoints:GrpcSecure.ClientCertificateMode` | `AllowCertificate` — handler rejects, not Kestrel.                                      |
| `Kestrel:Certificates:Default.Subject`       | Server cert subject. Default for outbound client cert.                                          |
| `Edm:Auth:Jwt.{Key,Issuer,Audience,ExpiryMinutes}` | HS256 settings. Override `Key` per-environment.                                           |
| `Edm:Auth:Jwt.RefreshThresholdMinutes`       | Cookie refresh window. Default 15.                                                              |
| `Edm:Auth:Roles.{Admin,Technologist,Operator}` | Maps EDM role → AD group name fragment.                                                       |
| `Edm:Auth:DivisionsRoot`                     | AD group prefix that yields `Divisions` claims.                                                 |
| `Edm:Auth:RemoteServices`                    | Allow-list of peer cert CNs / Subject DNs. **Principal CN is auto-appended; do not duplicate.** |
| `Edm:Intercom.Principal`                     | URL of master `IntercomHub` (e.g. `https://principal-host:16334`).                              |
| `Edm:Intercom.ClientCertificateSubject`      | Optional override for outbound client cert. Defaults to Kestrel server cert subject.            |

---

## 8. Common changes — where to start

| Task                                               | Touch this first                                       |
|----------------------------------------------------|--------------------------------------------------------|
| Add a peer host to the trust list                  | `appsettings.json` → `Edm:Auth:RemoteServices`         |
| New role-gated controller                          | `[RequireRoles("…")]` (not `[Authorize(Roles=…)]`)     |
| New peer-only gRPC endpoint                        | Map under existing pipeline; no extra config needed     |
| New browser endpoint that should bypass auth       | Add `[AllowAnonymous]` and justify in the PR           |
| Issue a JWT outside the SPA-bootstrap path         | `IJwtService.GenerateToken` (don't hand-roll)          |
| Outbound call to a peer host                       | Inject `IGrpcJobExecutor` (gRPC) or `IIntercom` (hub)  |
| Add a new cert-bearing transport                   | Add a path to `IClientCertificateProvider.Get`         |

---

## 9. Local-dev cert provisioning

Dev runs against `https://localhost:16334`, so the cert in `LocalMachine\My` must have `CN=localhost`, both **Server Authentication** and **Client Authentication** EKUs, and be reachable by the developer's user account. The recommended one-time setup uses a long-lived local CA so future renewals don't have to touch `Root` again:

```powershell
# Run elevated. Only touches CN=localhost / CN=Edm Dev CA — leaves any existing trust anchors alone.

# 1. Clean up our own dev artifacts only
Get-ChildItem Cert:\LocalMachine\My, Cert:\LocalMachine\Root |
    Where-Object { $_.Subject -in @('CN=localhost', 'CN=Edm Dev CA') } |
    ForEach-Object { Remove-Item -Path $_.PSPath -Force }

# 2. Issue local CA in My (private key here, used for signing)
$ca = New-SelfSignedCertificate `
    -Subject "CN=Edm Dev CA" `
    -KeyUsage CertSign, CRLSign, DigitalSignature `
    -KeyAlgorithm RSA -KeyLength 2048 -HashAlgorithm SHA256 `
    -Provider "Microsoft Software Key Storage Provider" `
    -KeyExportPolicy Exportable `
    -CertStoreLocation "Cert:\LocalMachine\My" `
    -NotAfter (Get-Date).AddYears(10)

# 3. Public part of CA into Root for trust (no private key in Root)
$rootStore = New-Object System.Security.Cryptography.X509Certificates.X509Store("Root","LocalMachine")
$rootStore.Open("ReadWrite")
$caPub = [System.Security.Cryptography.X509Certificates.X509Certificate2]::new(
    $ca.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Cert))
$rootStore.Add($caPub); $rootStore.Close()

# 4. localhost end-entity in My, signed by Edm Dev CA, with both EKUs
$cert = New-SelfSignedCertificate `
    -Subject "CN=localhost" -DnsName "localhost" `
    -Signer $ca `
    -KeyAlgorithm RSA -KeyLength 2048 -HashAlgorithm SHA256 `
    -Provider "Microsoft Software Key Storage Provider" `
    -KeyExportPolicy Exportable `
    -KeyUsage DigitalSignature, KeyEncipherment `
    -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.1,1.3.6.1.5.5.7.3.2") `
    -CertStoreLocation "Cert:\LocalMachine\My" `
    -NotAfter (Get-Date).AddYears(5)

# 5. Grant the dev user Read on the CNG private key (default ACL is SYSTEM + Administrators only).
#    Without this Kestrel cannot present the server cert at TLS handshake → "EOF or 0 bytes".
$out = certutil -store My $cert.Thumbprint
$keyName = (($out | Select-String 'Unique container name') -replace '.*:\s*', '').Trim()
$keyPath = Join-Path "$env:ProgramData\Microsoft\Crypto\Keys" $keyName
icacls $keyPath /grant ("$env:USERDOMAIN\$env:USERNAME" + ':(R)')
```

Renewals after the CA exists: only step 4 (issue a new end-entity cert) and step 5 (grant key Read) are needed — `Edm Dev CA` stays in place.

Sanity-check sequence to use when subscribe still fails:

| Symptom                                                       | Likely cause                                                 |
|---------------------------------------------------------------|--------------------------------------------------------------|
| `EOF or 0 bytes from the transport stream`                    | Kestrel can't read server cert's private key (ACL or wrong store). |
| `RevocationStatusUnknown`                                     | `RevocationMode = NoCheck` not configured (regression).      |
| `Certificate not allowed`                                     | Cert CN not in `RemoteServices` and doesn't match `Principal` host. |
| `401 Unauthorized` on Hub negotiate after handshake succeeds  | Outbound `HttpClientHandler` skipped the cert — Client Auth EKU missing. |

## 10. Conclusion

### Benefits

- **One cert, two roles.** Every host re-uses its Kestrel server cert as its outbound client cert, so deployment ships exactly one cert per box. Operators don't manage parallel cert pairs.
- **Convention-over-config trust.** Auto-appending `principalUri.Host` to `RemoteServices` means the most common allow-list entry is implicit. A typical peer host's `appsettings.json` only sets `Edm:Intercom:Principal`; no `RemoteServices` array needed.
- **Single auth pipeline, three transports.** `SmartAuth` lets gRPC, SignalR, and REST share the same `FallbackPolicy = RequireAuthenticatedUser`. There is no per-endpoint auth gate to maintain — drop `[AllowAnonymous]` and the endpoint is protected.
- **Active-role model matches reality.** `RequireRolesAttribute` denies an admin acting as Operator from hitting admin endpoints, which `[Authorize(Roles=…)]` would silently allow because the AD-derived `Roles` claim still lists Admin.
- **Transport isolated from domain.** `IGrpcJobExecutor` keeps `X509Certificate2` out of `StartOperationJob` and friends; jobs only know "execute on host X."

### Drawbacks

- **HS256 with a config-file key.** `Edm:Auth:Jwt:Key` lives in `appsettings.json`. If the file is checked in unmodified, the symmetric key is universal — token forgery becomes trivial. Per-environment override is **required** in production.
- **No revocation.** JWTs are stateless and live up to `ExpiryMinutes` (default 60). Revoking a user means waiting up to that long, or yanking their AD group membership and waiting for the next refresh.
- **Cert auth is binary.** The Certificate handler grants the single `RemoteService` role; there's no per-peer authorization (peer A and peer B see identical privilege on the cluster). Acceptable for a closed LAN; insufficient if peer trust ever needs to be partitioned.
- **Loopback bypass on the hub.** `IsInternalConnection` trusts any process on `127.0.0.1` / `::1`. On a multi-tenant box this would be a hole; on a single-purpose EDM host it's the only practical way for cert-less in-process consumers to subscribe.
- **`AllowInvalid = true` on Kestrel cert.** Self-signed certs with no chain validation. Fine for intra-LAN convention, ugly for any browser direct-hitting the host (browser shows untrusted-cert warning).

### Caveats

- **EKU must include both Server Auth (1.3.6.1.5.5.7.3.1) and Client Auth (1.3.6.1.5.5.7.3.2).** A common pitfall — the dev cert generated by `dotnet dev-certs` carries Server Auth only. `HttpClientHandler` then skips the cert when picking what to present, the Hub negotiate handshake reaches the server with no client cert, and the Certificate handler emits `401 Unauthorized`. See §9 for the provisioning script that gets this right.
- **Private CA → `RevocationMode = NoCheck` is mandatory.** The default `Online` setting hits CRL/OCSP URLs that private CAs don't publish; the handler then rejects every connection with `RevocationStatusUnknown`. The setting is enforced in `Program.cs` `AddCertificate` — don't remove it.
- **Private key ACL must include the WebApi's running user.** New CNG keys default to SYSTEM + Administrators. A non-admin dev account running `dotnet run` can't read the key, Kestrel can't present the server cert, and TLS aborts before the Certificate handler ever runs (symptom: "EOF or 0 bytes from the transport stream"). §9 step 5 has the `icacls` line.
- **`GrpcSecure` must be `Http1AndHttp2`.** SignalR Subscribe rides the same port as gRPC for cert-uniformity. HTTP/2-only breaks the WebSocket upgrade. If you ever split the ports, the outbound client must learn two URLs.
- **WebSocket cert is separate from HTTP cert in SignalR.** `ConfigureClientCertificate` configures both. Removing the `WebSocketConfiguration` branch reintroduces the silent-no-cert symptom we already fixed once.
- **Cert is loaded at startup, not on demand.** `ClientCertificateProvider` reads once in its constructor. Renewing a cert needs a service restart; rotation in-place is not supported.
- **`MSIRMSHUTDOWN=2`** during MSI install relies on the Restart Manager (RM) running server-side as LocalSystem to shut down the EDM service before file-locks check. This is unrelated to runtime auth but lives in the same trust boundary — see `Microprojects.Edm.Install` and the build skill.
- **`PluginManagementController` is gated by `[Authorize(Roles = "EDMAdmins")]`** — that's stock `[Authorize]`, not `RequireRolesAttribute`. Intentional: plugin load/unload should respect *any* admin claim on the identity, not just the active session role. Don't "fix" it.
- **CSRF check in `AuthControllerBase.UserInfo`** ignores port differences (host-only). Cross-port dev proxies work; cross-origin attacks would be blocked by browser SOP for the cookie anyway. Don't tighten without considering the dev-loop.
- **`RemoteServices` is matched against both Subject DN and simple CN.** Quoting matters — `CN=foo` and `foo` are distinct entries; the implicit principal-CN injection adds both. If you mix DN-style and CN-only entries by hand, audit before deploying.
