# EDM Plugin Iframe Messaging Spec

Single source of truth for how a host plugin's SPA exchanges data with an embedded plugin's SPA running inside an `<iframe>` (operation monitors, driver-option editors, profile editors, host consoles).

Trigger files (any change here implies this spec must be re-read first):
- `@microprojects/edm-components/src/iframe/PluginContainer.tsx`
- `@microprojects/edm-components/src/iframe/messagingHooks.ts`
- `Microprojects.Edm.Ui.Technologies/Ui/src/components/operation/OperationPluginContainer.js`
- `Microprojects.Edm.Ui.Technologies/Ui/src/components/operation/NewOperationWizard.js` (driver-options iframe in the wizard)
- `Microprojects.Edm.Ui.Technologies/Ui/src/components/config/profile/ProfileEditorTab.js`
- `Microprojects.Edm.Ui.Technologies/Ui/src/components/config/workplace/DeviceConfigEditor.js`
- `Microprojects.Edm.Ui.Technologies/Ui/src/components/config/host/HostConsole.js`
- any embedded SPA's top-level `App.js`/`App.tsx` (e.g. `Optosense.Edm.Operations.Test/TypeOneUi/src/App.js`, `Optosense.Edm.Operations.Optogen/ui/src/App.js`)

The reference implementation pair is **TypeOne** (`Optosense.Edm.Operations.Test/TypeOneUi`) on the child side and **OperationPluginContainer** (`Microprojects.Edm.Ui.Technologies/Ui/src/components/operation/OperationPluginContainer.js`) on the host side. New plugins should mirror this pair; older plugins still on `@microprojects/react-utils` are pending migration (see §7).

---

## 0. Architectural principles (read first)

These are non-negotiable invariants that shape every detail below.

1. **The iframe boundary is a trust boundary.** EDM is moving toward a cloud deployment that hosts **third-party / user-customised** profiles, drivers, and operations. The iframe is the only mechanism in the platform that gives us the necessary process- and origin-isolation. Do not propose Module Federation, native ESM imports, web components in shadow DOM, or any other "shared React tree" pattern: those collapse the boundary and re-enable a hostile plugin to read `X-Auth-Token`, mutate Redux, or hijack host UI.

2. **Embedded plugin SPAs make zero network calls.** No `axios`, no `fetch`, no SignalR client, no `useGet`. The host owns every byte that enters or leaves the backend. The child receives what it needs through typed postMessages and emits typed verbs back when it wants something persisted. The child's package.json should not contain an HTTP client.

3. **The child knows no host URLs.** Not the API base, not the route prefix, not the host's identity. The child is *pure UI*: data goes in via `INIT` and follow-up messages, commands come out via verbs like `SaveProfile`, `SaveSettings`. This is the only way a single plugin build can work unchanged under any host that speaks the protocol — and the only way third-party plugins can ship against a stable contract.

4. **Design for cross-origin from day one even though today's iframes are same-origin.** Today's same-origin iframes are a transitional reality, not a design target. The cloud target needs plugins on a separate origin (e.g. `plugins.<edm-host>` subdomain, or fully third-party-hosted URLs). The protocol, `targetOrigin` discipline, and any auth/data flow we design must work cross-origin unchanged. If something requires same-origin to function, it's the wrong design.

5. **The postMessage protocol is a public contract.** Once third parties code against it, every message type, payload shape, and version bump matters. The envelope must carry a version field from v1; message types must be additive (older clients ignore unknown types gracefully); breaking changes require a major-version bump and capability negotiation.

See [[project-edm-cloud-third-party-plugins]] and [[feedback-iframe-no-api-coupling]] for the reasoning behind these.

---

## 1. Why an iframe at all

A plugin's SPA is built and embedded as resources in its own DLL (`SpaPath` in `[PluginAttribute]`) and served by the host at `UiRoot`. (Long-term: the bundle is hosted at a stable URL on a sibling origin; see [[project-split-shell-from-plugin-payload]].) Operation monitors, driver-option editors, etc. are *foreign SPAs* from the host shell's point of view — different build, different React tree, sometimes different routing library, sometimes from a third party we don't trust. Embedding them as iframes:

1. **Establishes a trust boundary** — process/origin isolation, separate cookie jar (cross-origin), no DOM reach into the host. This is the load-bearing reason. The trust boundary value goes up sharply once cross-origin is the norm.
2. Keeps bundles isolated (no dual-instance hazards across React/MUI/Kendo versions).
3. Lets each plugin pick its own framework/router/version without the shell agreeing.
4. Provides an explicit, serialisable boundary (`window.postMessage`) for data exchange — no shared in-memory references, no shared store, no shared theme provider.

The cost: every value crossing the boundary must be JSON-serialisable, bootstrapping is async (the child can't render anything useful until the host has sent `INIT`), and richer interactions need carefully-versioned verbs.

---

## 2. The two packages — current state

Two iframe-messaging packages exist in the repo. **All new code uses `@microprojects/edm-components/iframe`** (the absorbed successor to the former standalone `@microprojects/tools`). `@microprojects/react-utils` is legacy and pending removal.

| Package | Status | Used by (callers still on it) |
|---|---|---|
| `@microprojects/edm-components/iframe` | **Canonical.** Typed message enum, frameId echo, send-cache, explicit `targetOrigin`. Lifted from the former `@microprojects/tools` package and re-homed under the iframe subpath (React-only peer deps). | `TypeOneUi`, `Operations.Optogen/ui`, `OperationPluginContainer`, the wizard's `NewOperationWizard` (host side via `PluginContainer` still on `react-utils`), `MasterDetail` (SmartScroll re-export only — now via the chrome subpath) |
| `@microprojects/react-utils` | **Legacy.** Untyped `{data, type, frameId}` messages, no targetOrigin, no caching. | `Profiles.Board/Ui`, `Profiles.Board/MuxDriverUi`, `Plugins.Operator/ui-profile`, `Plugins.Operator/ui-driver`, `Plugins.OpcUa/ui-driver`, `Drivers.RestApi/ui-driver`, `Drivers.Null/ui`, `Operations.Test/ui` (old monitor), host wrappers `ProfileEditorTab`, `DeviceConfigEditor`, `HostConsole`, and the driver-options iframe inside `NewOperationWizard` |

The two packages are wire-compatible **only for the INIT path** (host posts `{type, frameId, data}`, child reads `data`). Everything else — bidirectional messaging, message-type discrimination, send-before-load caching — is unique to `@microprojects/edm-components/iframe`.

Once Phase 6 of `.claude/plans/iframe-data-channel-migration.md` lands, `react-utils` loses its iframe surface entirely.

---

## 3. The `@microprojects/edm-components/iframe` contract

### 3.1 Message envelope

Every postMessage payload in either direction is:

```ts
interface IPluginMessage {
  protocolVersion: 1       // bumped on breaking changes — see §3.7
  type: PluginMessageTypes // discriminator — see enum below
  data: any                // type-specific payload (must be JSON-clonable)
  frameId: string          // round-trip identifier — see §3.2
}
```

Today's `messagingHooks.ts` doesn't yet carry `protocolVersion`; adding it is part of the spec-aligning work (Phase 0 of the migration plan). Older clients that don't read the field continue to work; newer hosts/children can negotiate capabilities once it lands.

`PluginMessageTypes` (`messagingHooks.ts`):

```
INIT          'Init'         host → child   one-shot bootstrap (full data the child needs to render)
READY         'Ready'        child → host   child is mounted and listening — host may now drain INIT/queued events
NAVIGATE      'Navigate'     host → child   deep-link / route push from operator menu
DEVICE        'Device'       host → child   record(s) — host has proxied a SignalR/data event
AUDIT         'Audit'        host → child   audit criteria results (proxied)
OPERATOR      'Operator'     host → child   operator-action prompt step (proxied)
LIFECYCLE     'Lifecycle'    host → child   start/stop event (legacy; new plugins read state from INIT)
SAVE          'Save'         child → host   {kind, data} — child wants the host to persist
REQUEST       'Request'      child → host   {correlationId, kind, params} — child wants the host to fetch
REPLY         'Reply'        host → child   {correlationId, ok, data?, error?} — answer to REQUEST
RESIZE        'Resize'       child → host   child requesting iframe resize
```

The enum is the canonical list. Adding a type is additive (old clients ignore unknown `type`s); changing a payload shape for an existing type is breaking and requires a `protocolVersion` bump.

The exact membership of this enum will be revised in Phase 0 of the migration plan — today's `SETTINGS` becomes `SAVE { kind: 'settings' }`, `READY` doesn't exist yet, and `REQUEST`/`REPLY` are aspirational (needed for the OpcUa node-browser case). The principles above hold either way.

### 3.2 frameId — why and how

Two iframes from the same plugin can coexist on a page (e.g. `NewOperationWizard` renders a driver-options iframe per selected device). Without an identifier, the host's `'message'` handler can't tell which child a `SAVE` event came from.

The host generates a fresh frameId once per iframe mount: `Math.floor(Math.random() * 10000000).toString()`. It stamps every message it sends to the child. The child's `usePluginMessaging` captures the frameId from the first message it receives and echoes it back on every outgoing message. The host then filters incoming events by frameId.

frameId is **not a security mechanism** — any code in an iframe can observe the frameId on its first inbound message and forge messages with it. It exists purely to route messages between multiple sibling iframes. Real isolation is the origin boundary (§3.4) and the trust assumption (§0).

### 3.3 READY handshake — why it replaces send-cache

The legacy approach: host posts `INIT` from `iframe.onload`, hoping the child's React tree has mounted and attached its message listener by then. It usually has, sometimes hasn't, and you get a silent INIT loss.

The new approach:
1. Child renders, attaches listeners in a `useEffect`, then posts `{type: READY, frameId: <captured-or-empty>}`.
2. Host buffers outbound messages (INIT plus any cached SignalR pushes) until it sees READY from the matching frameId.
3. Host drains the buffer in order.

This is deterministic and works the same cross-origin or same-origin. The "send-cache that flushes when contentWindow becomes truthy" pattern in today's `usePluginMessaging` is the wrong layer — it knows the iframe exists but not that React has mounted inside it.

The transition: once READY is in `@microprojects/edm-components/iframe` (Phase 0), plugins migrate one at a time. Hosts can treat absence-of-READY-within-N-ms as a legacy child and fall back to onLoad-fired INIT (a temporary compat shim during Phase 1–4).

### 3.4 targetOrigin

`postMessage(message, targetOrigin)` — the browser refuses delivery if the receiving window's origin doesn't match. Three rules, no exceptions:

1. **Always pass a concrete origin string.** Never `'*'`. Not in tests, not in dev, not "just for now".
2. **Cross-origin is the design target.** The protocol must work when host and child are on different origins. Today's same-origin reality is transitional; tomorrow's plugins live on `plugins.<edm-host>` or third-party URLs.
3. **The host knows the child's origin** because it sets the iframe `src`. The child knows the host's origin via `window.parent.location.origin` (which is readable cross-origin in modern browsers' `Location` object only for the `origin` property — verify) or, more robustly, via an origin field carried in the iframe URL or in the first `INIT`. Pick one and document it.

In dev where the child runs on `rsbuild dev`'s port, `targetOrigin` must be set to the host's dev origin (e.g. `https://localhost:5001`), not `'*'`.

### 3.5 `useOperationData` — typed receive

```ts
const records = useOperationData(PluginMessageTypes.DEVICE, info.records || [], (d) => { … })
```

Listens for messages of one type. Behaviour switches on the type of `initialState`:
- array → received `data` items are pushed; returns the running array.
- object or undefined → returns the last received `data` only.

This polymorphism is a known footgun; Phase 0 of the migration plan splits it into `useLatestMessage<T>` and `useMessageStream<T>`. Until then, be deliberate about the initial state's type.

The `handler` callback fires synchronously on message arrival; use it for side effects (computing derived state, calling `navigate`). Rely on the return value for rendering.

### 3.6 `usePluginMessaging` — bidirectional channel

```ts
const post = usePluginMessaging(targetWindow, frameId, targetOrigin, onMessage)
post({ type: PluginMessageTypes.SAVE, data: { kind: 'profile', textJson } })
```

Used on both ends:

- **Host side**: `targetWindow = iframeRef.current?.contentWindow`, generates its own `frameId`, passes the iframe's origin as `targetOrigin`, and `onMessage` is the upstream save/request handler.
- **Child side**: `targetWindow = window.parent`, `frameId = undefined` (captured from first inbound), `targetOrigin = <host origin known via env or first INIT>`. **NOT the host's API base** — that's a host-only concern and the child shouldn't have it.

Same hook on both ends keeps the wire symmetric.

### 3.7 Versioning and capability negotiation

`protocolVersion` is the source of truth. The current version is **1**. The contract:

- **Patch / minor**: additive only. New `PluginMessageTypes` enum entries, new optional payload fields. Older clients ignore what they don't recognise.
- **Major**: any breaking change — payload-shape change for an existing type, removal of a type, change in handshake order. Bump `protocolVersion`, document the change in this spec, and provide a deprecation window when possible.

INIT may carry a `capabilities` field listing optional features the host supports (`['save', 'request', 'navigate']`) so a child can adapt without probing. Future work.

---

## 4. The reference flow — `OperationPluginContainer` ↔ `TypeOneUi`

End-to-end sequence for an operation monitor session (with the planned READY handshake; today's flow is similar but loses the explicit READY step):

1. **Host: `OperationLayout` mounts.** Fetches `${api.operations}/${id}/info` and the operation-plugin's homepage descriptor via `${api.plugins}/${appGuid}`. Renders `<OperationPluginContainer>` with the operation info, the iframe URL, and a `saveSettings` handler that PUTs `SAVE { kind: 'settings' }` payloads back to the API.

2. **Host: `OperationPluginContainer` mounts.** Allocates a fresh `frameId`, subscribes to SignalR channels for the operation (`-operator`, `-data`, `-lifecycle`), creates an iframe.

3. **Host: SignalR fires before iframe is ready.** Each incoming event is wrapped in a `DEVICE`/`AUDIT`/`OPERATOR` envelope and **queued** awaiting READY.

4. **Browser: iframe finishes loading, child's bundle runs, React mounts, listeners attach in `useEffect`.**

5. **Child: posts `{type: READY}` to `window.parent`** with target-origin set to the host's origin (carried in the iframe URL).

6. **Host: receives READY**, drains the queue in order: `INIT` first, then any cached SignalR events.

7. **Child: `useOperationData(INIT)` matches the first message** — stores the operation info, derives settings from `data.settings`, renders the monitor.

8. **Child: subsequent SignalR-derived events arrive as `DEVICE`/`AUDIT`/`OPERATOR`.** Render updates.

9. **Child: operator changes settings.** Calls `post({type: SAVE, data: {kind: 'settings', payload}})`. `usePluginMessaging` stamps frameId, postMessages to `window.parent` with `targetOrigin`.

10. **Host: `'message'` listener matches frameId, invokes `onMessage({type: 'Save', data})`,** dispatches by `data.kind`. `OperationLayout.saveSettings` PUTs to `${api.operations}/${id}/settings`. The child **does not know that URL exists**.

11. **Operator action.** Server emits `Operation-{id}-operator` SignalR → host receives, renders `<OperatorAction>` overlay *outside* the iframe AND posts `OPERATOR` into the iframe so the child can show its own indication. Operator submits via the host overlay → host POSTs to the API directly (not through the iframe).

The child made zero network calls in this entire flow. It did not import `axios` or `fetch`. It did not know the host's API base existed.

---

## 5. The other host-side embedders

`OperationPluginContainer` is the only embedder currently on `@microprojects/edm-components/iframe`. The others still call the legacy `PluginContainer` from `@microprojects/react-utils`. The migration plan rebuilds them on a shared `PluginIframe` helper.

| Caller | Embeds | What it must send in INIT, after migration |
|---|---|---|
| `NewOperationWizard.js` per-device iframe | Driver-options SPA | `{ options, output }` — child sends `SAVE { kind: 'options', data }` back |
| `ProfileEditorTab.js` | Profile editor SPA | `{ profile, instructions }` — child sends `SAVE { kind: 'profile', data }` and `SAVE { kind: 'instructions', data }` back |
| `DeviceConfigEditor.js` | Driver's options editor SPA | `{ device, options }` — child sends `SAVE { kind: 'options' }` back |
| `HostConsole.js` | Cross-origin host-resident console | n/a — pure embed, no protocol; out of scope for this spec |

Today these wrappers send little or nothing in `data` and rely on the embedded SPA to fetch its own data. That's the bug source. The migrated wrappers fetch on the child's behalf.

---

## 6. Trust model & authentication

**The child has no access to backend resources.** That is the design.

- **In same-origin mode (today's transitional state):** the host's `X-Auth-Token` cookie is technically visible to the child, but no child code should read or use it. Treat the cookie's visibility as an accident of incomplete cross-origin migration, not as a feature to depend on.
- **In cross-origin mode (the target state):** the cookie is invisible to the child. CORS blocks anonymous backend calls from the child's origin. The only path between child and backend is `postMessage` → host → REST. Auth lives entirely on the host side.
- **Never push tokens, JWTs, session IDs, or credentials through the postMessage channel.** It is for application data only. If a feature seems to need this, the design is wrong — either rework so the child doesn't need the resource, or have the host proxy the call.
- **Cross-origin embedding of a third-party plugin requires explicit allow-listing in CSP `frame-src`** and (optionally) `Permissions-Policy` headers to revoke camera/mic/clipboard/etc. The admin surface for managing the allowed plugin origins is out of scope here but flagged in [[project-edm-cloud-third-party-plugins]].

If a child plugin genuinely needs to *cause* an authenticated backend call (e.g. "save these instructions"), it sends `SAVE` or `REQUEST` to the host and the host decides whether to allow, what URL to hit, and what payload to send. Authorisation gating lives on the host, not the wire.

---

## 7. Migration status & open work

Detailed phasing lives in `.claude/plans/iframe-data-channel-migration.md`. This section is the surface inventory.

### Done (canonical pattern)
- `Operations.Test/TypeOneUi` ↔ `OperationPluginContainer`
- `Operations.Optogen/ui` ↔ `OperationPluginContainer`

Both already speak `@microprojects/edm-components/iframe` and make no REST calls of their own. They lack the READY handshake and `protocolVersion` field; both land in Phase 0.

### Pending — embedded SPAs that still call HTTP from the child

These violate principle §0.2 (no network in child). Each one needs `useGet`/`axios`/`fetch` removed and the data flow inverted onto INIT.

1. `Profiles.Board/Ui` — profile editor. Currently has a tactical URL retargeting (`/api/profiles/{id}` → `/api/technologies/profiles/{id}`, landed 2026-05-14) that will be reverted as part of the migration.
2. `Plugins.Operator/ui-profile` — operator profile editor. Same tactical patch, same reversal.
3. `Plugins.OpcUa/ui-driver` — node-browser; needs `REQUEST`/`REPLY` verb pair (open question in the plan).
4. `Operations.Test/ui` and `Plugins.Operator/ui` — legacy monitors. Almost certainly retired in Phase 5, not migrated.

### Pending — embedded SPAs that are inert (no fetches) but still on `react-utils`

Mechanical migration: change imports, no behaviour change.

- `Profiles.Board/MuxDriverUi`
- `Plugins.Operator/ui-driver`
- `Drivers.RestApi/ui-driver`
- `Drivers.Null/ui`

### Pending — host-side embedders still on `@microprojects/react-utils`

- `NewOperationWizard.js`'s per-device options iframe
- `ProfileEditorTab.js`
- `DeviceConfigEditor.js`
- `HostConsole.js` (cross-origin, may stay as-is)

### Migration recipe — embedded SPA (child)

1. Delete every `useGet`, `axios`, `fetch`, and the `hooks.js` file if it only exists for HTTP.
2. Delete `ApiContext` and any wiring that supplied an API URL.
3. Delete `process.env.REACT_APP_API_URL`, `.env.development.local`'s API entry, and the `axios` dependency from `package.json`.
4. Replace data sourcing with `useOperationData(PluginMessageTypes.INIT, undefined, init => …)`.
5. Replace writes with `post({type: PluginMessageTypes.SAVE, data: {kind, payload}})` via `usePluginMessaging`.
6. Read the host's origin from the iframe URL or env, not from runtime context. Pass it as `targetOrigin`.
7. Post `READY` from the first effect once listeners are attached.

The migrated child should have zero knowledge of HTTP, URLs, or auth.

### Migration recipe — host-side embedder

1. Replace `PluginContainer` from `react-utils` with a direct `<iframe>` + `usePluginMessaging` (or the shared `PluginIframe` helper from the migration plan).
2. **Fetch the child's data yourself.** Pre-load profile, instructions, options, whatever the child needs.
3. Pass it all via INIT once the child sends READY.
4. Subscribe to `SAVE`/`REQUEST` from the child and translate to backend calls.
5. Pass `frameId`, `targetOrigin`, and the iframe's `contentWindow` ref explicitly — no implicit defaults.

### Cleanup (Phase 6)

Once no consumer remains, remove `PluginContainer.js` / `usePluginData` from `@microprojects/react-utils` and the currently-unused `PluginContainer.tsx` from `@microprojects/edm-components/iframe`.

---

## 8. Pitfalls (learned the hard way)

- **The child must not depend on host URLs.** The Board / Operator profile-editor bug existed because the child knew about `/api/profiles/`. The wrong fix is "pass the API base via INIT" — that's still coupling. The right fix is "host fetches and hands the data over". Don't backslide.
- **Settings persistence is asymmetric.** The child only knows what it's been told (via INIT) or what it's sent upstream. If two iframes for the same operation are open in different tabs, neither sees the other's saves until refresh. Servers must remain the source of truth.
- **READY must be posted after listeners attach, not from a render.** A first-effect (`useEffect(() => post({type: READY}), [])`) is the correct place; doing it during render races React's commit.
- **`onLoad` can fire more than once** (e.g. iframe `src` changes, navigation back). The host's `frameId` is held in `useState`, so it survives, but the READY/INIT exchange must be idempotent on both sides.
- **Never set `targetOrigin = '*'`.** Same-origin convenience now becomes a cross-origin vulnerability later, and the only thing harder than catching `'*'` in review is debugging the breach it eventually enables.
- **Iframes don't inherit React context or Redux.** Anything the child needs from the host crosses postMessage — including constants like theme tokens or the current user's display name. Build INIT payloads accordingly.
- **Don't push secrets through postMessage.** No tokens, no JWTs, no session IDs, no API keys. The channel is for application data. If a feature seems to require it, redesign — usually the right answer is "have the host do the action and report success/failure back".
- **The wire is a public contract once third parties code against it.** Treat enum entries and payload shapes the way you'd treat a published REST API. Add fields, don't remove them; bump `protocolVersion` for breaking changes.
