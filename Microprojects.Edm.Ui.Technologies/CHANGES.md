# Main EDM UI — User Changes

The Main UI is the EDM home screen: dashboard, new-operation wizard, the configuration trees (workbenches, devices, profiles, processes, audits) and the operation card with sensor reports. It is mounted at the site root.

## v2.0.0.0

- **Master tree — drop-on-empty-space and folder-delete refresh** (PR #70). Dragging a node onto whitespace outside any drop target used to silently do nothing on the Devices, Workplaces, Hosts and Process configuration trees; the drop now falls back to the visible local root so the move always lands somewhere sensible. Deleting a folder also refetches the tree, so the folder vanishes immediately instead of lingering until the next manual reload.
- **Density toggle now resizes the entire UI** (PR #65). Compact, Comfortable and Touch densities used to nudge a handful of row and field tokens; they now apply a `zoom` factor to the page root (Compact = baseline, Comfortable +15%, Touch +32%) so text, padding, icons and any hard-coded pixel sizes scale together. The viewport height is pre-divided by the active zoom so the shell stays exactly viewport-sized.
- **v2 visual redesign** (PR #55). The home page, master / detail layout, configuration trees (devices, profiles, processes, audits, hosts, workplaces, workbenches), the operation card and the dashboard adopt the new design tokens, density toggle and theme / scheme controls shared with Console and Logistics. Editor sections, properties grid and inline forms switch to the `Field`-based primitives; empty/error/loading states get a consistent presentation. See `docs/design-handoff-notes-v2.md` and the bundled `Edm design-handoff v2.zip` for the source material.
- **Master tree-view UX fixes** (PR #45). The detail panel and tree-view styling on the configuration trees are corrected so selections and panel layout behave as designed.
- **Operation start fix** (PR #42). Starting an operation from the Operation menu goes through reliably again — the menu wiring no longer drops the launch action.

## v1.13.28

- **Process picker fix in the New Operation wizard** (PR #41). Selecting a process is reliable again when a folder and a process happen to share the same numeric id — the picker now uses prefixed values (`process-…` / `node-…`) so the controlled state can't latch onto a disabled folder row.

## v1.13.0

- **Dashboard polish** (PR 793, PR 795, PR 796, PR 797, PR 798, PR 800). Operations are coloured by status; the today's-completed list filters yesterday's noise; the root dashboard drills down to running operations across processes; cancelled rows show *when* they were cancelled; a 7-day completed view is added; rows sort by completion / cancellation date.
- **Operation context menu and copy** (PR 783, PR 804). Right-click an operation to open, cancel or copy it; any completed operation can seed a new one in one click.
- **Editor & alert fixes** (PR 754, PR 755, PR 765, PR 790). Driver-options editor renders the right schema even when the device's driver has been changed, criterion-editor popup retains values when scrolled, condition-disabled inputs are still saved, and alerts are dismissable instead of blocking the page.
- **Latest sensor measures in report** (PR 748). Reports show the most recent measurement per sensor, not an arbitrary mid-run sample.
- **Smoother operation startup** (PR 784). Status flickers less during the start-up window because jobs and devices initialise before the wizard finishes.
- **Supply handling** (PR 715). Edit and consume supplies linked to a process directly from the Main UI.
- **Technology UI redesign** (PR 825). Reorganised around manufacturing processes with grades and specifications grouped together; the legacy view is replaced — bookmarks may need updating.

## v1.12.5

- **Saving fixes** (PR 589, PR 590). Driver-options edits now stick, and parameters typed in the wizard reach the device on start.
- **Operation card UX** (PR 586, PR 666). A dedicated × on the operation card to dismiss it without losing scroll; detaching a process from a workspace reflects immediately.
- **Date handling** (PR 680, PR 681). Backend timestamps are stored as UTC; the UI shows them in the user's locale.
- **Auth-friendly assets and quieter console** (PR 628, PR 667, PR 668). PWA manifest is reachable in both authenticated and unauthenticated flows; the phantom webworker error on every navigation is gone.
- **Faster sensor drill-down** (PR 684, PR 690). Sensor pages fetch one sensor on demand instead of the whole report.

## v1.12.0

- **New Operation wizard fixed up** (PR 567, PR 604). The wizard reliably carries the selected workbench / device through to start; restarting it no longer creates a duplicate operation.
- **Audit "equals" function** (PR 579). Audits can compare two parameters for equality, not only ranges.
- **Audit zone tab in card** (PR 573). Zones are a sibling tab on the operation card instead of buried in audit options.
- **Universal control panel** (PR 558). Operation cards share the Start / Cancel / Done bar with the operation apps.
- **User divisions** (PR 608). Operator filtering by division replaces the earlier ad-hoc role check.
- **Active-hosts list fix** (PR 610). Hosts that are alive show as such; a stale-cache regression is fixed.
- **Role switch fix** (PR 568). Switching role re-renders the menu correctly.
- **Deleted workplaces hidden in start-process picker** (PR 578).

## v1.0.0

- **Initial shell** (PR 218, PR 226, PR 228). Workplaces, operations, and the config sections that other plugins extend.
- **Workbench / process linkage** (PR 368, PR 371, PR 372). New-Operation only offers the devices whose profile the chosen process allows; profiles distinguish input and output parameters and the wizard collects only inputs; the workbench-attached profile shows on the device row.
- **Operation lifecycle UX** (PR 284, PR 422, PR 498). The operation card shows the device options that were active at job start; abandoned operations can be force-completed from the card; edits made in another tab push notifications to anyone who has the card open.
- **Audit by templates** (PR 294). Audit zones come from a template you edit once instead of per-operation copy/paste.
- **UI refresh** (PR 367, PR 382, PR 386). Bootstrap 5 / Kendo React 5 across the site; tree-view drag no longer selects half the page text; the leading `0` in a process-detail field is no longer eaten.
- **Host attach fix** (PR 380). Attaching a host to a device refreshes the device row immediately.
- **Operator desktop entry-points** (PR 432, PR 435). Buttons in the Main UI launch the operator UI and the Optosense general operator app.
- **ISL integration polish** (PR 431). Linkages to the ISL system work end-to-end on the Main UI side.
