# Main EDM UI — User Changes

The Main UI is the EDM home screen: dashboard, new-operation wizard, the configuration trees (workbenches, devices, profiles, processes, audits) and the operation card with sensor reports. It is mounted at the site root.

## v2.0.0.0

- **Drag-and-drop now lands somewhere sensible.** On the Devices, Workplaces, Hosts and Process trees, dropping a node onto empty space outside any target used to do nothing; the move now falls back to the visible local root. Deleting a folder also refreshes the tree immediately. <!-- cite: PR #70 -->
- **Density toggle scales the whole window.** Compact, Comfortable and Touch now resize text, spacing and icons together — pick the density that matches your screen and the entire UI follows. <!-- cite: PR #65 -->
- **Refreshed look across the site.** The home page, master/detail layout, configuration trees, operation card and dashboard adopt the new look shared with Console and Logistics, with density and light/dark controls available from the user menu. <!-- cite: PR #55 -->
- **Configuration trees behave as designed again.** Selections, detail panel and tree-view layout no longer drift. <!-- cite: PR #45 -->
- **Starting an operation from the Operation menu works again.** The launch action is no longer dropped. <!-- cite: PR #42 -->

## v1.13.28

- **New Operation wizard picks the right process every time.** A folder and a process sharing the same numeric id no longer confuse the picker. <!-- cite: PR #41 -->

## v1.13.0

- **Dashboard polish.** Operations are coloured by status; today's-completed list filters out yesterday's noise; the root dashboard drills down into running operations across processes; cancelled rows show *when* they were cancelled; a 7-day completed view was added; rows sort by completion / cancellation date. <!-- cite: PR 793, PR 795, PR 796, PR 797, PR 798, PR 800 -->
- **Operation context menu and copy.** Right-click an operation to open, cancel or copy it; any completed operation can seed a new one in one click. <!-- cite: PR 783, PR 804 -->
- **Editor and alert fixes.** Driver-options editor renders the right schema even after the device's driver was changed; criterion editor keeps values when scrolled; inputs disabled by a condition are still saved; alerts can be dismissed instead of blocking the page. <!-- cite: PR 754, PR 755, PR 765, PR 790 -->
- **Reports show the most recent sensor measurement.** No more arbitrary mid-run samples. <!-- cite: PR 748 -->
- **Smoother operation startup.** Status flickers less while jobs and devices initialise. <!-- cite: PR 784 -->
- **Supply handling.** Edit and consume supplies linked to a process directly from the Main UI. <!-- cite: PR 715 -->
- **Technology UI redesign.** Reorganised around manufacturing processes with grades and specifications grouped together; the legacy view was replaced — bookmarks may need updating. <!-- cite: PR 825 -->

## v1.12.5

- **Saving fixes.** Driver-options edits now stick, and parameters typed in the wizard reach the device on start. <!-- cite: PR 589, PR 590 -->
- **Operation card UX.** A dedicated × on the operation card dismisses it without losing scroll; detaching a process from a workspace reflects immediately. <!-- cite: PR 586, PR 666 -->
- **Date handling.** Times are shown in your locale. <!-- cite: PR 680, PR 681 -->
- **Quieter sign-in and navigation.** The PWA manifest is reachable in both authenticated and unauthenticated flows; the phantom error on every navigation is gone. <!-- cite: PR 628, PR 667, PR 668 -->
- **Faster sensor drill-down.** Sensor pages load on demand instead of pulling the full report. <!-- cite: PR 684, PR 690 -->

## v1.12.0

- **New Operation wizard fixed up.** The wizard reliably carries the selected workbench/device through to start; restarting it no longer creates a duplicate operation. <!-- cite: PR 567, PR 604 -->
- **Audit "equals" check.** Audits can compare two parameters for equality, not only ranges. <!-- cite: PR 579 -->
- **Audit zone tab on the card.** Zones live as a sibling tab on the operation card instead of inside audit options. <!-- cite: PR 573 -->
- **Universal control panel.** Operation cards share the Start / Cancel / Done bar with the operation apps. <!-- cite: PR 558 -->
- **User divisions.** Operator filtering by division replaces the earlier role check. <!-- cite: PR 608 -->
- **Active-hosts list shows the actual state.** Live hosts are flagged as such; the stale view is gone. <!-- cite: PR 610 -->
- **Role switching redraws the menu.** The chosen role is reflected immediately. <!-- cite: PR 568 -->
- **Deleted workplaces hidden in the start-process picker.** <!-- cite: PR 578 -->

## v1.0.0

- **Initial release.** Workplaces, operations and the configuration sections that other plugins extend. <!-- cite: PR 218, PR 226, PR 228 -->
- **Workbench / process linkage.** New Operation only offers devices whose profile the chosen process allows; profiles distinguish input and output parameters and the wizard collects only inputs; the workbench-attached profile shows on the device row. <!-- cite: PR 368, PR 371, PR 372 -->
- **Operation lifecycle UX.** The operation card shows the device options that were active when the job started; abandoned operations can be force-completed from the card; edits made in another tab notify everyone with the card open. <!-- cite: PR 284, PR 422, PR 498 -->
- **Audits by template.** Audit zones come from a template you edit once instead of per-operation copy/paste. <!-- cite: PR 294 -->
- **UI refresh.** Tree-view drag no longer selects half the page text; the leading `0` in a process-detail field is no longer eaten. <!-- cite: PR 367, PR 382, PR 386 -->
- **Host attach fix.** Attaching a host to a device refreshes the device row immediately. <!-- cite: PR 380 -->
- **Operator desktop entry points.** Buttons launch the operator UI and the Optosense general operator app. <!-- cite: PR 432, PR 435 -->
- **ISL integration polish.** Linkages to the ISL system work end-to-end. <!-- cite: PR 431 -->
