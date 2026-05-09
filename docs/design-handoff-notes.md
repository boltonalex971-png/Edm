# EDM Design Handoff — review notes

Notes produced after applying `docs/Edm design-handoff.zip` (Direction A · Steel) to the **Technologies plugin** redesign on 2026-05-08. Three sections:

1. What the handoff got right and what we extended in code.
2. Gaps to send back to the design team — UI surfaces production EDM ships that the handoff doesn't cover.
3. Where we deviated from the handoff intentionally and why.

The redesign also bumped Hub & Console from MUI v6.1.0 → v7.3.5 to consolidate on Technologies' MUI version.

---

## 1 · What the handoff got right and what we extended in code

The handoff's foundation is excellent and we used it almost unmodified:

| Foundation | Used as-is | Where in code |
|---|---|---|
| `assets/tokens.css` (Direction A · Steel) | Yes — verbatim copy | `Microprojects.Edm.Ui.Technologies/Ui/src/tokens.css` (byte-identical to `Microprojects.Edm.Ui.Console/Ui/src/tokens.css`, which was already canonical) |
| Per-role light scheme overlays from `schemes.html` (`[data-role="admin\|tech\|master\|op"][data-scheme="light"]`) | Yes | Embedded inside `tokens.css`. We map `appRoles.{admin,technologist,operator}` → `data-role={admin,tech,op}` in `Microprojects.Edm.Ui.Technologies/Ui/src/styles/role.ts` |
| Plugin-tinted top bar (`[data-plugin="…"] .doc-top` accent wash + 2px stripe) | Yes — pattern adopted | `Microprojects.Edm.Ui.Technologies/Ui/src/app.css` defines `[data-plugin="technologies"] .doc-top` using `var(--accent-tint)` + `var(--accent)`, so it auto-flips to operator green when the active role is op |
| Brand block (`<span class="brand-block"><span class="ed">ED</span><span class="mu">µ</span></span>`) with brand-green `µ` and accent-tinted `ED` | Yes | `app.css`, used by `NavMenu.js` |
| Calibrated signal palette (`--sig-run/--sig-warn/--sig-fault/--sig-idle/--sig-info/--sig-queued`) | Yes | Used by `Operations.module.scss` for run-state cards, by `Utils.js` (DetailStub/ErrorStub), by the `MasterDetail` Detail header accent wash |
| Data-row primitives `.s-row`, `.s-pip`, `.s-mono`, `.s-eyebrow` | Yes | Defined in `app.css`, ready for any component that wants the design's row look without going through MUI DataGrid |
| `.scheme-tabs` (top-of-section tab strip with 2px accent underline) | Yes | Replaces the legacy MUI segmented control in `SubRootPage.js` |
| Avatar square `.av` (the design's 22–28 px monogram block) | Yes | Renders the user initials block in the right end of the top bar |

Things we extended (not in the handoff explicitly, but extrapolated from the same vocabulary):

- **MUI theme bridge** (`theme.ts`). The handoff is HTML/CSS only. Bringing it into MUI required `MuiButton`, `MuiOutlinedInput`, `MuiTabs/MuiTab`, `MuiAppBar`, `MuiDataGrid`, `MuiTreeItem`, `MuiBreadcrumbs`, `MuiAlert`, `MuiChip`, `MuiMenu/MuiMenuItem`, `MuiDialog/MuiDialogTitle`, `MuiPaper` overrides — every override pulls colours from CSS variables (`var(--accent)` etc.) so the role-switching keeps working through MUI components.
- **Detail-card chrome** (`.detail-card`, `.detail-sticky-header`, `.detail-content-body`, `.detail-sticky-footer`, `.icon-wrapper`). The handoff shows static `Detail`-shaped cards for individual roles but doesn't define a reusable component. We made one in `app.css` + the `Detail.module.scss` SCSS module.
- **Card-on-hover accent stripe** (`.card.clickable::before`). The handoff's launcher-tile examples use a static accent edge; we made it appear on hover so the home tiles feel interactive.
- **Role-pill** (`.role-pill`). The role-selector dropdown wasn't in the handoff; we built one matching mono-uppercase 10.5px and the accent icon.

Markers we left in source: every hand-extended block in `app.css` carries no comment yet. Follow-up: add `/* improvised — handoff doesn't specify; revisit when design covers X */` next to `.detail-card`, `.role-pill`, `.icon-wrapper`, `.markdown` so the design-team review has a punch list directly in the source. (Adding markers is cosmetic and safe to do as a separate small commit.)

## 2 · What's missing from the handoff that production EDM needs

These are surfaces the Technologies plugin (and other EDM plugins) ships *now* but the handoff does not specify. Each one we either pulled from the existing implementation or extrapolated from neighbouring tokens — but the design system would be stronger with explicit coverage.

### Forms & editors

- **Multi-section editors with collapsible groups.** Logistics' Detail+Editor pattern groups fields into named sections (Identity / Hierarchy / Quantity / …). The handoff shows individual `.input` and `.field` primitives but no form layout, no section header, no `(N of M filled)` progress hint, no inline validation per field.
- **DropDownTree picker** for hierarchy choosers (`HierarchyPicker` in Logistics, the equivalent of "pick a Workplace" / "pick a Process" in Technologies). The handoff doesn't show how a tree picker should look — when collapsed, while open, with breadcrumb of the selection.
- **File upload** affordance — operation profile JSON is uploaded today; no handoff visual.
- **Rich text / markdown editor** — used in changelogs / op notes; no handoff visual.

### Wizards & multi-step flows

- **Stepper component**. `NewOperationWizard.js` is a multi-step Process → Workbench → Devices → Configuration flow. The handoff has no stepper, no horizontal "active vs. complete vs. disabled" step indicator, no per-step header card.

### Empty / error / loading states

- **Empty list** ("No items yet — create one"). Today: `DetailStub` icon-in-circle + heading + `Create` button — improvised.
- **Error stub** ("Failed to load — try again / go back"). Today: `ErrorStub` with icon-in-circle + heading + retry/back buttons — improvised.
- **Loading skeleton.** The handoff's `.loading-eyebrow` is text-only; we use MUI `Skeleton` rectangles inside `Loading()`. A canonical skeleton recipe per surface (master list / detail card / data table / form) would help.

### Data tables

The handoff shows static `.s-row` rows. Production EDM uses `@mui/x-data-grid` with all of:

- Sortable column headers (visual cue for asc/desc, multi-sort).
- Multi-select rows (checkbox column, header indeterminate, selection count surface).
- Sticky horizontal scroll, column resize handles.
- Virtualised rows.
- Inline-edit cells (TextField inside cell + commit-on-blur).
- Per-row actions on hover/focus (the `RelationTable.module.scss` `.rowActions` gradient pattern).
- Pagination footer (rows-per-page selector, page navigation, displayed-rows label).

None of these are designed. The current visuals are cobbled together from MUI defaults with theme overrides.

### Tree views with drag-drop

`TreeViewMaster.js` uses `@mui/x-tree-view` + `@dnd-kit` for hierarchical Process / Workplace / Host / Device trees with reordering. The handoff has no tree visual at all (no expand/collapse, no nested indent, no selected-node treatment, no drag handle, no drop indicator, no drag ghost).

### Dialogs / modals / drawers

- Confirmation dialog (the `Detail` delete confirm) — improvised on top of `MuiDialog`.
- Side-drawer pickers (used in some operation flows) — no spec.
- Toast / snackbar — no spec; we currently use no toast surface and fall back to `alert()` in error paths (which itself is a bug — see code review notes).

### Real-time / SignalR-driven surfaces

Operator dashboards consume a per-operation SignalR feed (`Operation-{id}-lifecycle`), polling at sub-second cadences. The handoff's operator screen (Tier-1 hero, Tier-2 vitals, Tier-3 action band) is excellent visually but *static*. Need a contract for:

- Live-update animation (do we flash a number when it changes? slide a row? do nothing?).
- Connection-state indicator (connected / reconnecting / disconnected) — separate from machine-OK.
- "Stale data" surface when the SignalR pipe lags.
- Reconnection toast or banner.

### Plugin embedding chrome

When a plugin's UI is embedded inside another plugin's iframe (Console embedded inside Technologies' HostConsole, or Operation plugins inside `OperationPluginContainer`), the embedded UI should drop the chrome (no top bar, no breadcrumbs) but keep tabs and body. Console's `embedded` mode does this today, but the design system has no spec for it. We need:

- The "embedded" frame visual (border? padding? min/max height handshake?).
- The embedded-tabs strip — probably the same `.scheme-tabs` but with a different padding context.

### Authenticated states

- Sign-in surface (the host owns this, but the plugin should match).
- Sign-out / "session expired" interstitial.
- "No role assigned" message — currently a plain `<span>` in `App.tsx`; needs a proper empty-state visual.
- Forbidden / 403 surface (when a user hits a route their role can't see).

### Plugin tile colours

The handoff lists per-plugin accent colours: `--plugin-routing` cobalt, `--plugin-workshop` orange, `--plugin-quality` green, `--plugin-flow` violet, `--plugin-yield` amber, `--plugin-vault` teal. Real EDM has only three application plugins today: Technologies, Logistics, Console. The mapping is:

| Real plugin | Handoff colour we'd use | Reasoning |
|---|---|---|
| Technologies | `--plugin-routing` cobalt | Most analogous to the design's Routing (technologist-owned process design) |
| Logistics | (not yet redesigned) | Could pick `--plugin-flow` violet to match logistics-as-flow framing |
| Console | `--plugin-admin` (cobalt) | Already lives on cobalt admin scheme |

Future EDM plugins would need a colour assigned. The handoff should state the rule for picking one (and what to do when we run out of the seven defined plugin tints).

### Density modes

`tokens.css` defines `.density-compact` and `.density-touch` modifiers. The handoff doesn't show how a UI looks under each density (especially `.density-touch` for the operator tablet); the operator big-screen example uses size overrides instead of `.density-touch`. Worth clarifying which approach is canonical.

### Dark scheme

We shipped light-only on this redesign per scope. The handoff's dark scheme is fully specified and we deferred it cleanly — `data-scheme="light"` on the root, ready to flip. But the design system should include explicit guidance on how the toggle is exposed (profile-menu item? user-settings preference? where does the persistence live?). Today there is no convention.

## 3 · What we deviated from intentionally

- **Confined the entity-tinted backgrounds to the icon frame, not the surface.** The legacy plugin tinted Process surfaces blue, Devices purple, Hosts green, Workplaces orange, etc. — a static palette with 11 entity types painted onto the *whole header*. We pulled that back so entity identity rides on the icon only: each entity type owns a soft+deep token pair (`--ent-{type}-soft` / `--ent-{type}-deep` in `app.css`). The Detail title's icon-wrapper takes both values (soft surface + deep glyph), and the TreeViewMaster items take only the deep colour with a transparent background. The body, header, and signal palette stay neutral — which keeps Rule 03 from `schemes.html` ("Status colors stay calibrated. Never invert run/fault.") intact: none of the entity tones overlap with `--sig-run/--sig-warn/--sig-fault/--sig-idle/--sig-info/--sig-queued`.

- **Dropped the chrome notifications bell.** The legacy `NavMenu.js` had a `<Badge badgeContent={3}>` icon button hardwired to "3" with no real source. We removed it entirely; it can return when there's a real notifications source. Captured under the "what's missing" section above so the design team can spec the notifications surface for when it does return.

- **Dropped the chrome help (`?`) icon.** Same reason: was a placeholder pointing nowhere. If a help system lands, it'll need its own design pass.

- **Dropped the system-status indicator dot in the footer.** Was decorative and always green; nothing fed it.

- **Per-role accent in the chrome instead of one fixed accent.** The handoff's plugin-tint convention pins the bar to the *plugin's* colour. We made the role surface (`data-role`) drive the accent, and let the plugin tint *also* travel through `--accent` because the technologist plugin happens to share cobalt with admin. The visible effect: when an operator switches to operator mode, the bar wash + stripe + DataGrid selection + buttons all flip to green. This is a slight extension of the handoff's intent but stays within the calibrated signal palette and respects Rule 03.

- **Plugin label stayed "Technologies"** rather than the handoff's "Routing." The handoff's `Routing` is the design team's exemplar name; the production plugin name is what the user already knows. Renaming the plugin (Guid + UiRoot + WebApi paths) was out of scope and risky.

- **Dropped redundant `sx` overrides** that the new `theme.ts` already handles (`textTransform: 'none'`, `borderRadius: '4px'`, primary-button colour). This concentrates style decisions in one file, per the user's "don't use [styling] directly in code" instruction.

## Follow-ups in the redesign source

Bugs / lint that surfaced during the redesign and should be fixed in a separate commit:

1. `Editor`'s axios calls in `MasterDetail.js` swallow PUT/POST errors silently. Add try/catch with an `<Alert color="error">` surface.
2. `_renderFunc`/`_selectedItem` module-level state in `MasterDetail.js` — replace with `React.Context`.
3. `Detail` transition timeouts (200 ms) are fragile under React 18 Strict Mode — switch to `useTransition` + CSS-only fades.
4. Two `Workplaces.js` (one in `dashboard/`, one in `config/`) — consolidate.
5. `Notifications`-source plumbing if the bell returns.
6. `appRoles` typing — add a `.d.ts` for `ApiContext.js` so TypeScript catches role typos.
