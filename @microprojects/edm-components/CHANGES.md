# @microprojects/edm-components — Changes

## 0.4.3 — `MasterDetail` / `TreeViewMaster` / `RelationTable` configurable new-item id

- **`newId?: string`** (NEW prop, default `'0'`). Added to both `TreeViewMaster` and `MasterDetail`. Drives the URL segment used by the Add Folder / Add Item header buttons and the empty-state DetailStub Add action — previously hard-coded to `'0'`. Tech (int-keyed entities) keeps the default; Logistics passes `EMPTY_GUID` so the new-item route hits a valid Guid the backend recognises as a fresh record. Fixes the "Failed to load data" Logistics users saw when pressing Add Item / Add Folder, where the Detail then GETted `${api}/0` and got 404 because Logistics ids are Guids. `MasterDetail` forwards `newId` to its inner `TreeViewMaster`.
- **`RelationTable` — `newId?: string | number`** (NEW prop, default `0`). `processRowUpdate` now stamps `dataToSave.id = newId` on a new row before POST, instead of the hard-coded `0`. Logistics's local `RelationTable` shim defaults `newId={EMPTY_GUID}` so creating a new row in Nomenclature ↔ Tare-types, Process Grades / Specification / Sub-processes and Order Specification tabs no longer fails with a model-binding error on the Guid id column.
- **`RelationTable` — row click now triggers `onRowSelected`.** Previously selection was checkbox-only (`disableRowSelectionOnClick` + `checkboxSelection={!!selectable}`) so a `RelationTable` with `onRowSelected` but no `selectable` was effectively dead — clicking a row did nothing. The DataGrid now also wires `onRowClick` and fires `onRowSelected` from there when `selectable` is off (the checkbox path stays exclusive when `selectable` is on, so the two don't compete). Rows in edit mode are skipped so an in-progress edit doesn't get torn down by a click. The handler also receives a second `update: () => void` reload callback so flows that POST and want to refresh the table (Logistics's "open the link pane and allocate components" flow on Order Specification) can do so without their own state. A subtle `cursor: pointer` is applied to rows when click activation is in effect. Existing single-arg consumers remain compatible.

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

## 0.4.2 — Logistics `Detail` adopts package `Detail` (visual swap)

The package's enriched `Detail` is now what every Logistics `Detail` consumer sees. Logistics's local `Detail` (Kendo `Card` + `CardHeader` + `Toolbar`) is gone — its 267-line implementation collapsed into a ~13-line wrapper that just injects `username` from Redux and forwards everything else to the package's `<Detail>`. All ~13 Logistics screens (OrderDetail, ItemDetail, NomenclatureDetail, TareDetail, SupplyDetail, BatchItemCreate, ItemSearch, OrderSearch, ItemGenealogyTree, TareTypes, Processes, Nomenclatures, Folder) automatically get the v2 Stack visual via the same `import {Detail} from '../MasterDetail'` paths they already used. Logistics's `Editor` stays Kendo-Form-based for now (separate, bigger lift).

### Package additions enabling the swap

- **`EMPTY_GUID`** (NEW export, `'00000000-0000-0000-0000-000000000000'`). Used by `Detail` to recognise Logistics's "new item" sentinel alongside Tech's `id === 0`. Both now route through `isNewItem`, which seeds initial edit mode and skips the cross-user lock acquire.
- **`DetailProps.editMode?: boolean`** — initial edit mode prop. `props.editMode || isNewItem` decides the initial state. Logistics's "New Order" / "New Supply" use this; Tech screens that pass `id={0}` keep working via `isNewItem`.
- **`DetailProps.readonly?: boolean`** — hides the edit/copy/delete action group entirely. Used by Logistics's read-only sub-detail panels.
- **`DetailProps.title?: string`**, **`subTitle?: string`** — override the header text (default: `data.name` / `data.description`). Lets consumers show "New Order" before the record exists.
- **`DetailProps.editable?` / `copyable?` / `deletable?`** — were already on the type; now actually wired into per-button visibility (`!== false` so default-true stays). Logistics's `Folder` uses `copyable={false}`.
- **`data?` is now optional** on `DetailProps` (was required) — Logistics passes `undefined` while loading; the existing optional-chained accesses make this safe.
- **`useOptionalInvalidateEntities()`** (NEW hook) — returns a no-op when `EntityRefreshProvider` is missing instead of throwing. Lets package `Detail` (copy + delete) and `Editor` (PUT + POST) emit `useEntityToken` invalidations safely in both Tech (no provider, no-op) and Logistics (provider, real refresh).

### Logistics-side rewrite

- `components/MasterDetail.tsx` — `Detail` function went from 267 lines to ~13. Re-exports `DetailEditModeContext` and `EMPTY_GUID` from the package so legacy import paths (`import {EMPTY_GUID} from '../MasterDetail'` etc.) keep working unchanged. Dead `ToolbarButton` helper deleted. Imports trimmed (Card, CardHeader, CardBody, CardSubtitle, CardTitle, Toolbar, ToolbarItem, ButtonGroup, ButtonProps, Alert, Loading, useEffect, useAcquireEntityLock, useEntityLockState all gone).
- `Editor`, `Info`, `RootItemContext`, `MasterDetail` exports unchanged.

### What Logistics screens now look like

All Logistics Detail screens render the v2 chrome: MUI Stack with sticky header, breadcrumbs, MUI IconButtons, fade-transition between items, MUI delete-confirm Dialog (replaces `window.confirm`), `🔒 Locked by` badge using the same amber styling, italic `outdated` badge. The lock + outdated behaviors use Logistics's existing `LockProvider` (mounted at app root) and per-record `Meta.Completed` mapping. Visible UX change for Logistics users — worth a smoke test before merging.

## 0.4.1 — Lift Logistics `Detail`/`Editor` enrichments into the package

The package's `Detail` and `Editor` now carry the behaviors that were previously Logistics-local. All additions are opt-in via data presence — Tech consumers (which don't trigger any of these) see no behavior change.

### Detail (`MasterDetail.tsx`)

- **Cross-user edit lock UI.** New `useAcquireEntityLock(props.type, id, editMode, props.username)` + `useEntityLockState(props.type, id)` calls. When another client has the lock, a `🔒 Locked by {user}` badge appears next to the title (amber `#b58900`); the edit/copy/delete buttons get disabled and their tooltips switch to `"Locked by {user}"`. A `useEffect` force-flips the local Detail out of edit mode if a remote lock arrives after we entered edit (race when two operators press Edit simultaneously). New `username?: string` prop on `DetailProps` — required to acquire the lock; when absent, the lock is never acquired (Tech path).
- **Outdated badge.** When `props.outdated` (or `props.data?.outdated`) is true, an italic `outdated` badge appears next to the title; edit + copy buttons get disabled with tooltip `"Outdated — open the current version to edit"`. New `outdated?: boolean` prop with the data-fallback. Delete remains enabled (still allowed on outdated rows).
- **`DetailEditModeContext`** (NEW export). The Detail provides `setEditMode` via the context; Editor consumes it (see below) so a successful save flips the parent Detail back into view mode.

### Editor (`MasterDetail.tsx`)

- **Foreign-data flattening.** New module-private `flattenForeignData(data)` — converts `{nested: {id: 5, name: 'Foo'}}` to `{nested: 5}` before POST/PUT, matching the wire format EDM controllers expect (Logistics's Editor pattern). Dates and arrays pass through untouched. Applied uniformly to PUT and POST bodies.
- **Fork-required 409 dialog.** PUT path: when the backend responds `409 + {code: "fork-required"}`, Editor shows a `window.confirm` with the server's `detail` message. On confirm it retries with `?force=true`; on cancel it silently returns. Tech doesn't currently emit this code, so the path is dead for Tech but live for Logistics's nomenclature/tare-type flows.
- **`DetailEditModeContext` consumer.** After a successful POST or PUT, `setDetailEditMode?.(false)` flips the parent Detail back to view mode (no-op if no Detail above the Editor).
- **Route-state-supplied `parentId`.** `useLocation().state.parentId` now overrides the `_selectedItem`-derived parent when present — supports "Add child" navigations that target a specific folder regardless of which tree node is selected.

### Lock hooks gracefully no-op without `LockProvider`

Required for the lift since Tech doesn't mount `LockProvider`:

- `useEntityLockState`, `useOrderClaimState`, `useAcquireEntityLock`, `useAcquireOrderClaim` switched from a throwing `useStore()` to an `useOptionalStore()` that returns `null` when context is absent. State hooks return `NO_LOCK` and acquire hooks skip the effect. The bridge-facing `useLockSetters()` still throws (it's plugin-bridge code that genuinely requires the provider).

### Logistics-side

No change required this iteration — Logistics keeps its own Detail/Editor (Kendo Card/Form-based) for now. The package additions prepare the ground for a later visual migration where Logistics Detail consumers swap to the package versions.

## 0.4.0 — Logistics adopts package `MasterDetail` (chrome swap)

The actual MasterDetail/TreeViewMaster swap that was deferred from Phase 3b. Logistics's local 192-line MasterDetail wrapper + 320-line Kendo-based TreeViewMaster are gone; Logistics's `MasterDetail.tsx` is now a ~50-line thin wrapper around `@microprojects/edm-components`'s MasterDetail. Detail/Editor/Info stay Logistics-local for now (they carry lock/outdated/fork-conflict logic the package doesn't have yet — separate iteration).

### Package additions (TreeViewMaster + MasterDetail)

- **`refreshToken?: unknown`** — external refetch signal (typically a value from `useEntityToken`). Included in the GET dep array. Lets consumers re-fetch the tree when an entity invalidation fires elsewhere in the app, not just on the tree's local `setRender` bump.
- **`onRootLoaded?: (rootNode) => void`** — fires with the first raw API node when data loads. Lets the parent hold "the tree's root" for parent-id resolution on new-item creation (Logistics's `RootItemContext` wires this up).
- **`getHierarchyQuery?: () => Record<string, string | undefined>`** — builds query-string params appended to `${api}/hierarchy`. Lifted from Logistics for `kind` discriminators on typed-tree endpoints.
- **`unwrapSingleRoot?: boolean`** (default `false`) — Logistics convention: when the API wraps every child under a single root folder, render that root's children at the top level instead of the root itself. Tech keeps the default (false) so the existing single-root behavior is preserved.
- All four are forwarded MasterDetail → TreeViewMaster.

### Logistics-side rewrite

- `components/MasterDetail.tsx` — `MasterDetail` function rewritten as a wrapper that mounts the package's MasterDetail with `refreshToken={treeToken}`, `onRootLoaded={setRootItem}`, `getHierarchyQuery={props.getHierarchyQuery}`, `unwrapSingleRoot`, and a `FolderForType` closure that injects Logistics's lowercase `type` (e.g. `'nomenclature'`) into the existing `Folder` component (the package's URL-prefix-derived `entityType` doesn't match Logistics's invalidation discriminators, so the closure overrides it). `RootItemContext.Provider` still wraps the tree so Editor's parent-id fallback keeps working. The Logistics-side `PaneSeparator` is gone (the package's draggable separator handles it).
- `components/TreeViewMaster.tsx` — **deleted**. ~320 lines, Kendo-based; nothing imports it anymore.
- `Detail`, `Editor`, `Info`, `EMPTY_GUID`, `DetailEditModeContext`, `RootItemContext` exports unchanged so the 12+ consumers (Order/Item/Tare/Supply/Nomenclature/Process detail screens + Folder + several editor panels) keep working.

### What's still Logistics-local (deferred for next iteration)

`Detail` and `Editor` still carry behavior the package's versions don't have:
- Cross-user edit-lock UI (`🔒 Locked by {user}` banner, disabled buttons when locked)
- Outdated banner + edit-disabled when `Meta.Completed != null`
- 409 fork-required → confirm dialog → retry with `?force=true` in Editor.handleSubmit
- DetailEditModeContext (Editor flips parent Detail's edit mode after save)
- Foreign-data flattening (`{nested: {id:5}}` → `{nested: 5}`) before PUT/POST

Lifting these is the next iteration when the time is right (probably alongside the broader Detail UI unification).

## 0.3.6 — Logistics adopts package `Search` (3 call sites swapped)

First real Phase 3c-style swap: Logistics's three `Search` callers (`Items`, `Orders`, `Supplies`) now consume `@microprojects/edm-components/components/page/Search` instead of the Logistics-local component. Each swap moves from the old hard-coded `(api, type, stubMessage, search, detail)` shape to the new consumer-driven `actions: SearchAction[]` shape with MUI icons. Dead state vars (`panel`/`linkPanel`/`searchClick`/`createClick` no-op handlers, plus an unreferenced `LinkPanel` helper in `Orders.tsx`) deleted along the way. Logistics-local `components/Search.tsx` (with its process-coupled `SearchDetail`) was confirmed unused and deleted; the file is recoverable from git if `SearchDetail` is ever wanted back. Logistics build clean.

## 0.3.5 — `dropOutdated` no longer prunes empty folders

- **`HierarchyPicker` / `dropOutdated`** — split out the empty-folder pruning behavior. Previously `dropOutdated` did two things: drop outdated leaves AND prune folders that became empty as a result. The second behavior leaked into Logistics's `TreeViewMaster` (which calls `dropOutdated(data, undefined)` to hide auto-forked leaves) and made freshly-created empty folders invisible in the master tree even though the backend was returning them. Fix: `dropOutdated` now only handles outdated leaves; new exported `pruneEmptyFolders<T>(nodes)` handles empty-folder pruning. `HierarchyPicker` chains both (`pruneEmptyFolders(dropOutdated(data, value))`) so the picker keeps its prior behavior — there's nothing to pick inside an empty folder. Logistics's TreeViewMaster shim picks up the fix automatically (no shim change needed) and the new empty folder now appears.

## 0.3.4 — Folder creation fixes (Tech)

Two bugs surfaced when creating new folders against the Tech `HierarchiesController` (the rename made the parentId bug more visible by changing `node-` → `folder-`, but it was always present):

- **`MasterDetail` Editor — parentId.** The POST body was sending `_selectedItem.id` (the prefixed MUI tree id, e.g. `"folder-1033"`) as `parentId`. The backend's `Hierarchy.ParentId` is `int`, so binding failed with *"Could not convert string to integer: folder-1033"*. Fixed: use `_selectedItem.numericId` for folders and `_selectedItem.parentId` for leaves (parentId is already the numeric parent id as a string), and `parseInt(rawParent, 10)` before sending so the wire value is a JSON number.
- **`MasterDetail` → folder route — `entityType`.** The Editor's POST body sent `type: 'folder'` (the literal Folder.js constant), but Tech's `Hierarchy.Type` is a `HierarchyType` enum (`Any`/`Process`/`Workplace`/`Host`/`Device`) parsed via `JsonStringEnumConverter` — `"folder"` isn't a valid value, so binding failed. Fixed: `MasterDetail` now derives a capitalized `entityType` from its `api` URL via `getEntityType` (e.g., `/workplaces` → `"Workplace"`) and passes it to the `FolderComponent` as a new prop. Tech's `Folder.js` consumes `props.entityType` and forwards it to `<Editor type={...}>` so the POST body sends `"Workplace"` (or `"Process"` etc.) — values the enum binder accepts.
- The `folderComponent` prop type widened to require an optional `entityType?: string` on the rendered component.

This unblocks Tech's Add Folder action (200 OK with the right `Type` persisted). The `entityType` is also future-proof for the planned shared-base-DbContext: an untyped Logistics-style `Directory` simply ignores the value.

## 0.3.3 — Hierarchy field naming: `isNode` → `isFolder`

Renamed the folder/branch flag from `isNode` to `isFolder` across the package's hierarchy primitives. Reasoning: `isFolder` is plain English, matches the UI metaphor (folder icon, "Add folder" button), and is the term Logistics already uses; `isNode` is technically a misnomer (leaves are nodes too in tree terminology — the field really means "branch / non-leaf"). This also unblocks Logistics's tree data flowing through the package's `transformData` without a per-consumer normalization shim.

- **`treeUtils.ts`** — `RawTreeNode.isNode?` → `isFolder?`; `TreeNode.isNode` → `isFolder`. `transformData`'s id prefix changed `node-{id}` → `folder-{id}` (kept paired with the boolean rename so prefix-based fallback detection still works). `getAllFolderIds` and `checkMoveValidity` updated accordingly. `getIconForType`'s second positional arg renamed `isNode` → `isFolder` (consumers passing positionally don't need to change anything).
- **`TreeViewMaster.tsx`** — `IndustrialTreeItemProps.isNode` → `isFolder`; local `itemIsNode` → `itemIsFolder`; prefix-based fallback now tests `'folder-'`; dnd payload keys flipped; selection-handler folder-route check, drag-end target-parent + link selection, and the drag overlay's icon/colour/weight all read `isFolder` now.
- **`MasterDetail.tsx`** — Editor's parent-id resolution and post-save navigation use `isFolder` (the URL still contains the literal `'folder'` segment as it always did).
- **Tech backend** (mirror): `HierarchyItem.IsNode` → `IsFolder`; `HierarchyViewModel.IsNode`/`HierarchyItemViewModel.IsNode` → `IsFolder`; `HierarchyHelper.cs` (5 reads in `ToTree` + `FillFrom`); `WebModelMappings.cs` (4 assignments in `Clone`/`ToHierarchyItem` overloads). The field is computed/DTO-only — **no EF migration needed**.
- **Tech UI** (mirror): `NewOperationWizard.js` — `item.isNode || isWorkplace` → `isFolder`; the in-memory tree id prefix `node-{id}` → `folder-{id}` (matches the package's new prefix; only used internally by the wizard's MUI `Select`).
- **Logistics** — already used `isFolder` everywhere; no changes.
- **Future task** — full hierarchy unification (typed Tech `Hierarchy` → untyped Logistics `Directory` base class with `Children` navigation, Guid PKs, `Meta` audit fields) is the long-term shared-base-DbContext project; this rename is the first step.

## 0.3.2 — Search page-layouting primitive

- **`Search`** (NEW, `components/page/Search.tsx`) — two-column layout primitive lifted from Logistics's `components/Search.tsx`. Left rail of vertical action buttons, right pane mirroring the active action's content. The Logistics original hard-coded three buttons (`Search` / `Create new` / `Get from accounting system`) — that's gone; the primitive now takes `actions: SearchAction[]` (each `{key, label, icon?, panel?, onClick?, disabled?}`) so the consumer owns the rail. Built on MUI `Button` (replaces Kendo `Button`); icons accept any ReactNode (replaces hard-coded `react-bootstrap-icons`). Uses `SmartScroll`/`SmartScrollContent` for sticky-scroll behaviour, same as Logistics. The active button switches via internal state, with an optional `defaultKey` initial selection. Three Logistics call-sites (`Items`, `Orders`, `Supplies`) — and any future page that needs the search-or-create rail layout — can adopt this in Phase 3c without writing a custom rail. Logistics-side `SearchDetail` (process-coupled, references `Api.processes`/`Api.nomenclatures`/`missedInputs`) was deliberately NOT lifted — it isn't a primitive.

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
