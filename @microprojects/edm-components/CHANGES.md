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

## 0.3.1 — MasterDetail draggable pane separator + tree-item ellipsis/tooltip

- **`MasterDetail`** — gained a draggable divider between the master tree and detail panes. Lifted from Logistics's `components/MasterDetail.tsx` (the `PaneSeparator` component + `containerRef`/`masterPx`/`mode` state machinery). Behaviour: 16 px invisible col-resize hit area between the two `SmartScrollContent` slots; on pointer-down captures pointer, locks `body.cursor`/`userSelect`, and renders a 220 px vertical gradient guide that follows the cursor; drag clamps the master pane to `[80 px, container width / 3]`; a `ResizeObserver` re-clamps the manual width when the viewport shrinks. New optional `resizable?: boolean` prop on `MasterDetailProps` (default `true`); set to `false` to keep the previous fixed `flex: 1` / `flex: 5 1 0%` split. Tech callers pick up the resizer automatically with no source change. Unblocks the Logistics MasterDetail swap by removing the UX-regression risk.
- **`TreeViewMaster` row name — ellipsis + native tooltip.** Lifted from Logistics's `TreeItem` (the `title="name — description"` pattern). Long names now clip with single-line ellipsis instead of pushing the row width — critical now that the master pane is resizable down to 80 px. Hovering exposes the full text via a native browser `title`; when the entity has a `description` distinct from its `name`, the tooltip shows `name — description`. To plumb description through, `RawTreeNode` and `TreeNode` (in `treeUtils.ts`) gained an optional `description?: string` field, `transformData` carries it across, and a new `collectDescriptions(treeData)` helper builds an `itemId → description` map that `TreeViewMaster` passes to the slot via `slotProps.item.descriptionMap`. SCSS adds `min-width: 0; overflow: hidden` to `.MuiTreeItem-label` and a `.labelText` class with `text-overflow: ellipsis; white-space: nowrap`. No consumer changes required — backends that don't return `description` simply yield no tooltip content.

## 0.3.0 — react-router-dom v7

Package migrated from react-router-dom v5 → v7 to unblock Logistics adopting the package's chrome (Layout, NavMenu, MasterDetail, TreeViewMaster, SubRootPage). Tech also migrated in lockstep.

- **MasterDetail** — `useRouteMatch().path` removed; `path` is now a **required prop** on `MasterDetailProps`. Internal `<Switch>` replaced with `<Routes>` using relative paths (`index`, `folder/:id`, `:id`); requires the consumer's parent Route to be declared as `path="<base>/*"` (wildcard) for nested URLs to render. `useHistory` → `useNavigate` throughout.
- **TreeViewMaster** — `useRouteMatch().url` replaced with `useResolvedPath('').pathname`; `useHistory` → `useNavigate`.
- **Layout / NavMenu / SubRootPage** — used only `Link`, `NavLink`, `useLocation` which are wire-compatible across v5 and v7. No source changes needed.
- Peer dep raised to `react-router-dom: ">=7"`. Devs and Tech bumped to `^7.5.0`.

### Tech-side migration mirror

- All `<Switch>` → `<Routes>`, `useHistory` → `useNavigate`, `useRouteMatch().path` → `useResolvedPath('.').pathname`, `<Redirect to>` → `<Navigate to replace>`.
- App.tsx structural change: previously `<Switch>` had `<Layout>` as a non-Route sibling acting as catch-all. v7 doesn't allow that — layout now sits in a parent Route via Outlet pattern.
- Sub-root parent Routes (`Config`, `Dashboard`, `Plugins`) now declare child paths as `dashboard/*`, `config/*`, etc. with `/*` so MasterDetail's nested Routes resolve.
- rsbuild.config.ts: dropped the legacy `react-router` and `history` aliases (RR7 bundles both internally; the dirs don't exist).

### Logistics — unblocked but not yet using the chrome

The reason for the upgrade: Logistics (already on RR7 since pre-Phase-3) can now import package chrome without `ESModulesLinkingError`. The actual chrome swap (MasterDetail/Layout/NavMenu/TreeViewMaster) belongs to the next 3b/3c iteration.

## 0.2.2 — Phase 3b (cosmetic swaps in Logistics)

Two of the four planned swaps landed; the other two surfaced blockers documented below.

- **HierarchyPicker** — Logistics's local `components/HierarchyPicker.tsx` is now a thin re-export shim over the package version. Helpers (`findInHierarchy`, `pruneHierarchy`, `dropOutdated`) made **generic** in the package (`<T extends HierarchyNode>`) so Logistics's richer `TreeDataItem` shape passes through without losing fields like `directoryId`, `expanded`, `groups`. Eight Logistics call sites (Processes, DropDownTreeCell, BatchItemCreate, ItemDetail, AllocateProcessOutput, OrderDetail, Repacking, TreeViewMaster) work unchanged. Picker also now seeds expansion from each node's `expanded` field (defaulting folders to expanded when the field is absent — matches Kendo DropDownTree's behaviour) and removes `disabled={isFolder}` on tree items so the chevron is still clickable; folder labels are dimmed bold to signal non-selectable. **IMPROVISED — v2 design polish deferred:** current implementation uses raw MUI primitives without v2 token treatment (no `--r-2`/`--ink-3`/`--field-h`, default chevron stroke, MUI selected-ring instead of v2 background tint, no v2 folder icon). Restyle alongside the package-wide v2 design pass after Logistics adoption stabilises.
- **InlineAlert → useToast** — Logistics's `components/InlineAlert.tsx` is rewritten as a bridge: it re-exports `AlertState` (so existing `(setAlert: (s: AlertState) => void)` prop contracts survive), exports a new `useAlertSetter()` hook that maps status → toast severity (`'danger'` → `error`, `'warning'` → `warning`, `undefined` → `success`), and keeps `InlineAlert` as a no-op render stub for safety. Five callers migrated (`ItemSearch`, `BatchItemCreate`, `ItemDetail`, `MasterDetail`, `OrderDetail`); a sixth (`OrderSpecificationTab`) only imports the type and needed no change. Visual surface moves from absolute-within-parent to viewport top-right (matches the `<ToastProvider position="top-right">` mounted in 3a).

### Skipped in 3b

- **MasterDetail / Detail swap** — blocked. Package's MasterDetail uses `useHistory` + `useRouteMatch` (react-router-dom v5); Logistics is on `react-router-dom@^7` which exports `useNavigate` + `useMatch`/`useParams` instead. Either migrate package chrome to v6+ patterns or downgrade Logistics — both are big architectural calls. Defer until decided.
- **Empty/loading/error chrome** — Logistics has no unified `EmptyState`/`Skeleton*`/`Alert` usage today (grep returned nothing); each screen rolls its own ad-hoc loading indicator. Lifting requires per-screen visual decisions, deferred to 3c.

## 0.2.1 — Phase 3a (Logistics bootstrap)

Logistics is now a consumer of the package. No screen swaps yet — this iteration only wires the package providers in alongside Logistics's existing Kendo chrome so Phase 3b/3c can do the actual swaps incrementally.

- **Granular subpath exports** — added `./components/*`, `./hooks/*`, `./styles/*` wildcard entries to the exports map so consumers on a different react-router-dom version (Logistics is on RR7) can import individual modules without pulling the whole RR5-bound chrome (Layout, NavMenu, MasterDetail, TreeViewMaster) into their export-resolution graph. Existing barrel imports (`./components`, `./hooks`, etc.) still work for consumers like Tech that use the chrome.
- Logistics-side: `entityRefresh.tsx` and `entityLocks.tsx` are now thin re-export shims over the package primitives. Only difference: Logistics's `entityLocks.tsx` keeps a wrapper around `useAcquireEntityLock` that pre-validates `type` via `parseEntityType` before delegating, so a typo never publishes a phantom lock onto the wire.
- `<LockProvider publisher={...}>` is mounted with a `LockPublisher` that wraps Logistics's `publishLogisticsMessage` + event factories. `<UiPreferencesProvider storageKeyPrefix="logistics.">` and `<ToastProvider position="top-right">` are mounted around `<App>`. No visual change yet (no screens swap to package components in 3a).
