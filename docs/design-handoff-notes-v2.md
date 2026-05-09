# EDM Design System v2 — Technologies plugin handoff notes

These notes capture what landed in the Technologies plugin from `docs/Edm design-handoff v2.zip`,
where we stayed on-spec, where we deviated, and what was deferred to follow-on tickets.
They mirror the structure of the v1 review (`design-handoff-notes.md`) and assume the v2 spec
pages (`chrome.html` 04f, `forms.html` 04d, `extensions.html` 04c, `platform.html` 04e, `patterns.html`)
as the source of truth.

## What v2 added on top of v1

1. **12 generic entity hue tokens** (`--hue-azure`, `--hue-cobalt`, … `--hue-slate`) in `tokens.css`,
   each with a soft/deep pair, replacing the per-plugin improvised `--ent-{type}-{soft|deep}` set.
2. **Recoloured cobalt accent** — `--accent-deep` `#1838AB` → `#36488A`, `--accent-soft`
   `#E1E8FF` → `#DEE3F2` (more muted, reads calmer in dense data tables).
3. **Brand mark switched** to the `applogo.svg` image (42 × 30) shipped at `src/assets/applogo.svg`.
4. **4 new spec pages** filling the v1 gaps: chrome (top-bar slots + page-head squeeze), forms,
   extensions (realtime/data tables/state surfaces), platform (embedded/auth/density/scheme).
5. **Detail panel 4-zone CSS Grid** layout in `patterns.html` formalising the
   `.dp-head` / `.dp-content` / `.dp-tabs` / `.dp-foot` structure.

## Phase-by-phase outcomes

### Phase A — Tokens + accent recolor ✅
- `src/tokens.css`: added the 12 `--hue-*-soft`/`--hue-*-deep` pairs and recoloured the cobalt accent.
- `src/app.css`: replaced the 11 hex pairs in `:root` with hue-alias bindings. Hosts pick up jade-green
  per the user's choice; processes/cobalt, devices/violet, workplaces/amber, etc.
- `src/theme.ts`: palette `primary.dark`/`primary.light` updated to match.

### Phase B — Brand mark ✅
- `src/assets/applogo.svg` shipped (copied from `public/applogo.svg`).
- `src/components/NavMenu.js` renders an `<img class="brand-mark">` instead of the CSS-rendered EDµ.
- **DEVIATION**: the previous CSS-rendered mark drove the "ED" colour from `--accent`, picking up the
  per-role tint (admin/tech cobalt → operator green). The SVG is fixed-colour and loses that — accepted
  for brand fidelity per v2 sign-off. Marked in `app.css` `.brand-mark` block.

### Phase C — Chrome polish ✅
- `src/components/NavMenu.js`: rebuilt the top bar around the v2 seven-slot grid (brand · nav ·
  spacer · search · role pill · connection pip · profile). Role pill is now a button-triggered Menu
  styled per `.tb-role` (mono uppercase 11 px on `--accent-tint`). Operator role wears `--sig-run`.
- `src/app.css`: added `.tb-search`, `.tb-pip`, `.tb-spacer`, `.tb-role` primitives and a 3-step
  narrow-width overflow rule (≤1080 px hides search text · ≤880 px hides nav labels and search ·
  ≤720 px hides role pill text).
- `src/components/SubRootPage.js`: rebuilt as `.doc-crumbs` (28 px) + `.page-head` (72 → 48 px on
  body scroll past 12 px, 180 ms cubic-bezier). Tabs stay 14 px regardless of squeeze.
- `src/components/Layout.js` + `app.css`: footer dropped to 36 px, never sticky-overlay.
- **IMPROVISED**: the search slot is visual-only (no real search wiring); the connection pip is
  hardcoded to `connected`. Both marked at the call site in `NavMenu.js`. Wiring the pip to the live
  SignalR lifecycle is deferred to the `useConnectionState` hook (see Phase F deferred items).

### Phase D — Detail panel grid refactor ✅
- `src/components/Detail.module.scss`: `.stickyHeader` switched from flex to a 3-column grid with
  the v2 4-zone layout (`. crumbs toolbar` / `icon name status` / `. desc desc`). Icon sized 44 × 44.
- `src/components/MasterDetail.js`: header JSX flattened — children carry only `grid-area` via their
  classes; `.headerContent` and `.titleArea` wrappers removed. New optional `status` prop on `Detail`
  exposes the top-right status zone for callers that want to render a badge there.
- No caller pages needed changes (`config/Hosts.js`, `config/Devices.js` etc. already pass `data`/`icon`).

### Phase E — Forms (sliced) ⚠️
**Shipped**:
- Delete confirmation dialog upgraded to v2 04d.8 destructive variant: `sm` 380 px paper, mono entity
  name in body, "Delete <type>" commit copy.

**Deferred** (genuinely 1.5 days of integration; not blockers for the visual upgrade):
- `forms/EditorSection.tsx` — collapsible long-form sections with fill-progress.
- `forms/FieldStates.module.scss` — formal pristine/focused/valid/warning/invalid TextField states.
- `forms/HierarchyPicker.tsx` — DropDownTree picker per 04d.3.
- `forms/FileUpload.tsx` — drop-zone + file-row list per 04d.4.
- `forms/MarkdownEditor.tsx` — toolbar + side-by-side preview per 04d.5.
- `NewOperationWizard.js` rework — adopt v2 stepper with 4 explicit visual states.
- `TreeViewMaster.js` drag-drop visual feedback (into / between / forbidden) — non-trivial because
  drop-target rendering is buried in MUI X's `RichTreeView` slot internals.
- `forms/SideDrawer.tsx` — right-side drawer per 04d.9.

**Recommendation**: split into a per-component ticket and ship piecemeal. Wizard rework is the
highest-risk; do it last and behind a feature flag.

### Phase F — Extensions (sliced) ⚠️
**Shipped**:
- `src/components/states/Toast.tsx` — `ToastProvider` + `useToast()` hook with severity-tinted Snackbar
  (4 px left rail per 04c.3). Wired into `App.tsx`.
- Editor save/copy/delete in `MasterDetail.js` now toast on success and surface server errors instead
  of silently swallowing them. Closes v1 bug #1.

**Deferred**:
- `realtime/useConnectionState.ts` — wraps `signalRHooks.ts` lifecycle to drive the chrome connection
  pip (currently stubbed to `connected`).
- `realtime/ValueFlash.tsx` — flashes the background `--accent-tint` on numeric value change for
  operator counters.
- `RelationTable.js` rework to v2 04c.2 production data-table spec (sortable/multi-select/inline
  edit/hover actions/sticky/pagination). High-risk per the original plan; should land per-page or
  behind a flag.
- `states/EmptyState.tsx`, `states/ErrorState.tsx`, `states/LoadingSkeleton.tsx` as standalone
  exports — the existing `DetailStub` / `ErrorStub` / `Loading` in `utils/Utils.js` already render
  the v2 visuals (icon-in-circle, signal-tinted, optional CTAs); promote them to canonical exports
  when the next surface needs them.

### Phase G — Platform ⚠️
**Shipped**:
- `src/components/auth/AuthInterstitial.tsx` — one component, four severities (signin · expired ·
  no-role · forbidden) per 04e.3-5. Replaces the inline `<span>` strings in `App.tsx`'s
  `{user && !userRole}` and `{!user}` branches.
- `src/styles/density.ts` + `src/styles/scheme.ts` — read `localStorage.edm.density` /
  `localStorage.edm.scheme`, default `comfortable` / `light`. `App.tsx` applies
  `densityClass(density)` to `.page-root` and `data-scheme={scheme}` to the same root, so the
  tokens.css density modifiers and dark overlay take effect. Per-device persistence per 04c.4 amendment.
- `src/theme.ts` MUI bridge audit against canonical platform.html 04e.7:
  - `MuiButton.disableElevation` ✅ (already set)
  - `MuiTab.minHeight` 40 → 36 (corrected)
  - `MuiAppBar` (no shadow + bottom border) ✅
  - `MuiAlert` 4 px left rail with severity-tinted colour (added)

**Deferred**:
- `embedded/EmbeddedShell.tsx` — drop the top-bar when iframe-mounted inside another plugin (e.g.
  Console-in-Technologies HostConsole). No active embedding contract today; defer until needed.
- A profile-menu UI to flip density and scheme at runtime — the read utilities are in place, but
  there's no surface yet. Ship next to the broader profile menu redesign.
- `auth/SignIn.tsx` standalone surface — `AuthInterstitial kind="signin"` covers the post-redirect
  interstitial today; promote when sign-in flow is plugin-owned (currently host-owned).

### Phase H — Source-side markers ✅
Every block extending past the spec carries one of the 4 markers from 04e.8. Files marked:
`tokens.css`, `theme.ts`, `app.css`, `Detail.module.scss`, `NavMenu.js`, `SubRootPage.js`,
`MasterDetail.js`, `AuthInterstitial.tsx`, `Toast.tsx`, `density.ts`, `scheme.ts`.

No hex literals leaked into component code or `*.module.scss` (verified by `grep '#[0-9a-fA-F]{3,8}'`
across `src/`); the only matches are `tokens.css`, `theme.ts` palette (MUI requires hex), and the
SVG asset.

## Cross-plugin recommendations

1. **Console / Hub plugins**: pull the same `tokens.css` so the recoloured accent and 12 hue tokens
   propagate. Their `app.css` overlays should bind their entity types onto the same hue palette
   (Console's HostConsole would naturally re-use cobalt for processes, jade for hosts, etc.).
2. **Per-plugin SignalR channel** convention (see user memory) means a single `useConnectionState`
   hook shape can serve all plugins; build it once in a shared package rather than per-plugin.
3. **DesignToken bridge**: `theme.ts` palette still hardcodes hex for the `palette.primary.*`
   block because MUI's `createTheme` doesn't accept CSS variables there. The component overrides
   below use CSS variables throughout. Consider a small build-time generator if drift becomes painful.

## Bugs from v1 — status

1. ✅ **Editor silent error swallow** — fixed via Toast in Phase F slice.
2. ⚠️ **`_renderFunc`/`_selectedItem` module-level state** in `MasterDetail.js` — still present;
   touch when doing the wizard rework or the next significant Detail change.
3. ⚠️ **Detail transition timeouts (200 ms)** — still on `setTimeout`; switch to `useTransition`
   when next refactoring `useLayoutEffect` blocks.
4. ⚠️ **Two `Workplaces.js` files** in `dashboard/` and `config/` — not consolidated; rolled forward.
5. ⚠️ **Missing `.d.ts` for `ApiContext.js`** — not added; rolled forward to a TS migration ticket.

## Verification ran

- `npm run build` in `Microprojects.Edm.Ui.Technologies/Ui` — clean (0 errors, 81 pre-existing
  ESLint warnings unchanged from baseline).
- Hex-literal audit across `src/` — clean (only `tokens.css`, `theme.ts` palette, SVG asset match).
- Source-side marker audit — every modified file carries the appropriate marker.

Manual smoke (still pending the user's walk-through):

1. Home (`/`) — role flip cobalt → cobalt → green; brand mark renders (SVG); entity hues on tiles.
2. Config (`/config/processes`, `/config/hosts`) — TreeView icons in cobalt/jade; Detail header
   in the new grid; status slot empty by default.
3. Operations (`/dashboard/operations`) — DataGrid still renders with v1 visuals (RelationTable
   rework deferred).
4. NewOperationWizard (`/operation`) — still on v1 visuals (rework deferred).
5. Auth interstitials — flip the URL or sign-out to surface no-role / signin variants.
6. Density toggle — `localStorage.edm.density = 'touch'; location.reload()` should grow rows/buttons.
7. Dark scheme — `localStorage.edm.scheme = 'dark'; location.reload()` should set
   `[data-scheme="dark"]` on `.page-root`; visible cascade requires the upstream `.theme-shop` rules
   in `tokens.css` to be re-keyed off the attribute (PENDING noted in `scheme.ts`).
8. Save/delete/copy a record — Toast surfaces success and error messages.
