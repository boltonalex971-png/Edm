# @microprojects/edm-components — Changes

## 0.1.0 — initial scaffold (Phase 1)

Phase-1 lift of v2 primitives from `Microprojects.Edm.Ui.Technologies/Ui/src/`. Lifts are TypeScript-converted (no logic refactor) per the extraction plan.

- Package scaffolded with rslib (mirrors `@microprojects/tools` config) plus `@rsbuild/plugin-sass` for `.module.scss` compilation.
- Entries: `components`, `hooks`, `styles`, `utils`, plus `styles/chrome.css` and `styles/tokens.css` side-channels.
- Style contract documented in `STYLE_CONTRACT.md`.

### Carry-overs to address in Phase 2

- Refactor `_render`/`_renderFunc`/`_selectedItem` global mutation in `TreeViewMaster` and `MasterDetail` to a context-based imperative handle.
- Add `onActivity()` callback to `useConnectionState` so consumers can refresh `lastSeen` from observed traffic.
- Make `UiPreferencesProvider` storage injectable (sessionStorage / no-op) and storage-key prefix configurable.
- Re-evaluate `Toast` API (position, action, persistent, queue) when comparing with Logistics's `InlineAlert`.

## 0.2.0 — Phase 2 audit lifts

Driven by the Phase 2 pre-replacement audit of Logistics components. Adds primitives and knobs Logistics will need when it adopts the package in Phase 3. All changes are additive — Tech keeps working without modification.

- **`hooks/entityRefresh`** (NEW) — `EntityRefreshProvider`, `useEntityToken(tags)`, `useInvalidateEntities()`, `EntityTag`, `listTag(type)`. Tag-based invalidation primitive; lifted verbatim from Logistics. Plugins build their own SignalR-to-tag bridges on top.
- **`hooks/entityLocks`** (NEW) — `LockProvider`, `useEntityLockState`, `useOrderClaimState`, `useLockSetters`, `useAcquireEntityLock`, `useAcquireOrderClaim`. Edit-lock + order-claim store with publisher-injected broadcast. Plugin passes a `LockPublisher` (publishEntityLock/Unlock, publishOrderClaim/Release, getCurrentConnectionId) on `<LockProvider publisher={...}>`; the package stays free of plugin-specific event factories.
- **`useConnectionState`** — added `notifyActivity()` to the returned state. Consumers wire from message handlers (e.g. SignalR onReceive) so the stale timer resets and `lastSeen` advances on observed traffic.
- **`UiPreferencesProvider`** — new optional props `storage` (Storage | null; default `localStorage`, `null` disables persistence) and `storageKeyPrefix` (default `'edm.'`). The standalone `readDensity` / `writeDensity` / `readScheme` / `writeScheme` helpers gained matching positional `(storage?, keyPrefix?)` parameters and now tolerate environments without `window.localStorage` (returns the default).
- **`ToastProvider`** — new optional `position` prop (`'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'`, default `'bottom-right'` matches prior behaviour).
- **`forms/HierarchyPicker`** (NEW) — MUI port of Logistics's Kendo `DropDownTree`-based picker. Preserves canvas-measured auto-sizing (input min-width to widest leaf label; popup pinned to input width on open) and the policy-aware helpers (`findInHierarchy`, `pruneHierarchy`, `dropOutdated`). Built on `TextField` + `Popper` + `SimpleTreeView` (`@mui/x-tree-view`).
- **tsconfig** — added `target: "ES2022"` (was defaulting to ES3, broke Set/Map iteration in entityRefresh).

### Carry-overs to address in Phase 3

- **`_render`/`_renderFunc`/`_selectedItem` refactor — deliberately deferred.** Tech's four config callers (Workplaces / Devices / Hosts / Processes) all import `reloadMaster` as a free function. The current global pattern works because there's only one MasterDetail per page; converting to a context-based hook is a wider API change that risks Tech regression with no functional payoff. Revisit when Phase 3 wires Logistics through and we have actual multi-instance use cases or a test plan.
- **RelationTable + MasterDetail entity-refresh wiring** — both should consume `useEntityToken` once Logistics is on the package. Hold until Logistics adopts and validates the API shape.
- **MasterDetail draggable pane separator** — Logistics-only feature today, lift during Phase 3 when Logistics's UX is being preserved.

## 0.2.1 — Phase 3a (Logistics bootstrap)

Logistics is now a consumer of the package. No screen swaps yet — this iteration only wires the package providers in alongside Logistics's existing Kendo chrome so Phase 3b/3c can do the actual swaps incrementally.

- **Granular subpath exports** — added `./components/*`, `./hooks/*`, `./styles/*` wildcard entries to the exports map so consumers on a different react-router-dom version (Logistics is on RR7) can import individual modules without pulling the whole RR5-bound chrome (Layout, NavMenu, MasterDetail, TreeViewMaster) into their export-resolution graph. Existing barrel imports (`./components`, `./hooks`, etc.) still work for consumers like Tech that use the chrome.
- Logistics-side: `entityRefresh.tsx` and `entityLocks.tsx` are now thin re-export shims over the package primitives. Only difference: Logistics's `entityLocks.tsx` keeps a wrapper around `useAcquireEntityLock` that pre-validates `type` via `parseEntityType` before delegating, so a typo never publishes a phantom lock onto the wire.
- `<LockProvider publisher={...}>` is mounted with a `LockPublisher` that wraps Logistics's `publishLogisticsMessage` + event factories. `<UiPreferencesProvider storageKeyPrefix="logistics.">` and `<ToastProvider position="top-right">` are mounted around `<App>`. No visual change yet (no screens swap to package components in 3a).
