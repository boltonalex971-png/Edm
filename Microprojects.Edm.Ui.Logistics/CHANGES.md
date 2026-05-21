# Logistics App — User Changes

The Logistics app (`/logistics`) covers nomenclature, tare, supplies, items, orders, repacking, allocation, the operator desktop, and the manufacturing process tree. It was added in v1.13.0 and has been the focus of most recent work.

## v2.0.0.0

- **Refreshed look across the app.** Homepages, the operator desktop, the configuration trees (Nomenclature, Tare types, Processes) and the item / order / allocation flows pick up the same fonts, density and colour scheme as Technologies, Console and the Hub. <!-- cite: PR #58 -->
- **Add Item / Add Folder no longer fail with "Failed to load data".** Creating a new Nomenclature, Tare type or Process from the master-tree Add button (or the empty-state Add action) opens the editor cleanly. <!-- cite: PR #58 -->
- **Adding a new row in relation tables works again.** Nomenclature ↔ Tare-types, Process Grades / Specification / Sub-processes, Order Specification — the "Add record" button now creates the row instead of failing. <!-- cite: PR #58 -->
- **Order Specification — clicking a component row opens the allocation pane.** The row click works on the Specification tab again. <!-- cite: PR #58 -->
- **New Order — auto-incremented Order # is pre-filled again.** The Create-new panel shows the next sequential number as the editor opens. The same fix applies whenever you switch between items in the master tree. <!-- cite: PR #58 -->
- **Component lookup — tare rows are expandable again.** In the lookup pane opened from an Order Specification row, the chevron toggles each tare, the expanded view shows the same tare schematic, slot click selects items, and double-click on a tare row allocates the whole tare. <!-- cite: PR #58 -->
- **Order Specification — "Hide totally allocated" switch is now inline.** The switch sits in the table toolbar — search on the left, switch on the right. <!-- cite: PR #58 -->
- **Order tabs — Specification and Operations are now view-only.** Both tabs render as pure data tables, with no Add button and no row-action column. <!-- cite: PR #58 -->
- **Orders header link opens Active by default.** Clicking "Orders" now lands on /orders/ongoing with the Active sub-tab highlighted. <!-- cite: PR #58 -->
- **Order detail — info card and editor reorganised.** The view-mode card now surfaces Start and Due dates and the description alongside Amount, Nomenclature and Process — no need to enter edit mode just to read the schedule. In the editor, Amount sits next to the Process picker so "what to make" and "how much" are filled in together. <!-- cite: PR #58 -->
- **Order search refreshes when an order is deleted.** Deleted rows no longer linger in the search list. <!-- cite: PR #58 -->
- **Order Specification — each order owns its own copy of the process spec.** Components in already-launched orders no longer reshape themselves when the process or its nomenclatures are edited later. Components whose nomenclature has been deleted or completed are skipped at creation time. Orders created before this change start with an empty Specification tab and need their rows added once. <!-- cite: PR #58 -->
- **Allocate / Repack — barcode selection adds the tare in one step.** Scanning a barcode in Allocate Output or Repacking drops the tare straight into the workspace (auto-creating it against the order's default tare type when the barcode is new), so a scan goes from input to a populated target slot without an extra click. <!-- cite: PR #62 -->
- **Tare schematic — clicking an item opens its detail.** Items in a tare (on the Items page and inside Tare detail) now open in a read-only sub-panel next to the tare, so you can review an item's history without leaving the tare view. <!-- cite: PR #63 -->
- **Sub-detail panes close after a successful delete.** Tare and Item sub-details opened from a parent screen — and the inline panes opened from relation tables — no longer leave stale content visible after a delete. <!-- cite: PR #66 -->
- **Drag-and-drop in the master tree lands somewhere sensible.** Dropping a node onto empty space outside any target used to do nothing; the move now falls back to the visible local root. Deleting a folder also refreshes the tree immediately. <!-- cite: PR #70 -->
- **Breadcrumbs in nested Detail panes.** Every Detail (and every sub-detail opened from one of its rows) shows a path back through parent records, so "Order → Tare → Item" is visible at the top of a drilled-in pane. The trail also uses correct plural names (Processes, Tare types). <!-- cite: PR #72 -->
- **Supply detail — Components is a regular relation tab.** Items inside a supply are listed in a flat table with search in the toolbar and "Add items" on the right; clicking a row opens the item detail next to it, the same way other tabs work. <!-- cite: PR #73 -->
- **Item genealogy — Inputs panel reads right-to-left.** The current item sits on the right and ancestry extends to the left, matching the natural "where did this come from?" reading direction. Outputs still flow left-to-right from the current item outward. <!-- cite: PR #74 -->
- **Order Specification — Required / Allocated render as proper numbers.** Fully-allocated countable nomenclatures no longer display as `0.9999999999999999`; countable lines snap to whole pieces, fractional lines trim trailing zeros. <!-- cite: PR #58 -->

## v1.13.28

- **Repacking — Reset and source-tare visibility.** Reset returns pending-moved items to their original slots. A source tare row stays visible while all of its items have been moved out, so you can see what you've removed and clear the tare manually when you're finished. <!-- cite: `550d3bb` -->

## v1.13.27

- **Footer with versions and "What's new".** The shell footer shows the plugin version, the EDM product version and a link to the user-facing changelog. <!-- cite: `c4d54f7` -->
- **Unified allocation & repacking.** Allocate Output, Repacking and the tare schematic share one selection-and-transfer mechanic with a context menu, grade and nomenclature legends, and a single visibility filter — picking source items and dropping them onto a target tare behaves the same way everywhere. <!-- cite: `a466381` -->
- **Auto-incremented order number.** New orders get a sequential number on save, preserving the format of the previous order (`1`, `2`, …, or zero-padded forms like `ORD-0043`). The order detail shows it as a `#<number>` heading and it appears on the desktop order list, item detail and genealogy nodes. Orders without a positive Amount are rejected at save with a clear error. <!-- cite: PR 28, PR 35 -->
- **Order UX polish.** The order list refreshes when an order is created or completed; after a successful Create, the right panel flips from the New-Order form to a view of the just-created order; the allocate-output target tare type pre-fills from the nomenclature's default; the tare panel opened from an order tab matches the row summary instead of double-counting allocation splits; an empty Output tab shows "Not executed yet" instead of being blank. <!-- cite: PR 31, PR 32, PR 33, PR 34 -->
- **Item genealogy redesign.** Genealogy tree nodes show item details on hover, edges are colour-coded by origin (output, store, supply, split), and items created directly without a supply or parent are flagged with a "store" origin. <!-- cite: PR 30 -->
- **Item lifecycle — quantity stays put.** An item's quantity is fixed when the item is created and never decremented — consumption is tracked separately — so executed orders keep their original allocation visible in history, tare-fill and order-allocation figures correctly account for partially-consumed items, and the items-count noise in notifications is gone. <!-- cite: `8fd3ce9` -->
- **Dates and times in your locale.** Date and date-time fields across orders, supplies, the operator desktop, folder details and relation tables render in your locale; times no longer drift by your local offset. <!-- cite: PR 27 -->
- **Per-type root folder.** Nomenclature, Tare type, and each process kind (Manufacturing, Technology, Operation) each open at their own pre-seeded root in the directory tree, so a new entry lands under the right root automatically. <!-- cite: PR 26 -->
- **Versioning of tare types, nomenclatures and processes.** Saving a non-trivial edit to one of these that already has live or historical references asks whether to fork — the edit becomes a new version, the original is frozen, and existing items, orders and history continue to render against the version they were created under. Trivial edits (Name, Description) still update in place. Pickers and the master tree only show the current version, so old forks don't appear as duplicates in selection lists. <!-- cite: PR 24, PR 37 -->
- **Cross-user refresh and locks.** Changes made by another user propagate to your open views; the Detail toolbar's Copy and Delete are disabled (with a "Locked by …" tooltip) while another user holds the lock; folder changes correctly invalidate every leaf view, not just the one matching the folder's own type. <!-- cite: PR 19, PR 22, PR 23 -->
- **Master-tree drag-and-drop fixes.** Drag-and-drop targets are resolved against the visible (filtered) tree instead of the raw data, so drops land on the intended folder; navigating between process kinds no longer drops new items into the previous view's folder. <!-- cite: PR 20, PR 21 -->

## v1.13.22

- **First-run data on empty database.** Default nomenclatures, tare types and processes are seeded so the app is usable out of the box; database migrations run automatically. <!-- cite: PR 4, PR 15 -->
- **Tare filtering and store provenance.** Operators only see tare types and barcodes the active nomenclature allows and that the user's groups permit; items created directly (with no supply, no producing process and no parent link) are flagged as a "store" origin in the item detail and genealogy tree. <!-- cite: PR 11, PR 12, PR 14 -->
- **Picker quality.** All directory pickers use a hierarchical drop-down tree respecting user-group policies; popups widen to the longest entry so values aren't truncated. <!-- cite: PR 10, PR 13 -->

## v1.13.0 — first release

### Directories
- **Nomenclature and tare directories.** Full create / edit / delete for nomenclature and tare types with fractional quantities and units displayed inline, plus a bidirectional link between them — edit the relation from either side. <!-- cite: PR 711, PR 712, PR 727, PR 734, PR 9 -->
- **Empty folders hidden in pickers.** Keeps the directory tree readable. <!-- cite: PR 826 -->

### Processes & specifications
- **Process tree.** Manufacturing-process directory with type, parent and configuration; per-process specification tab and grades on technology processes; processes presented as separate trees by kind with hidden roots; the parent picker only offers child types it allows; Manufacturing tree opens by default in Settings; the new-order picker is a tree, not a flat list. <!-- cite: PR 708, PR 716, PR 824, PR 827, PR 828, PR 831, PR 833, PR 835, PR 836 -->
- **Process fixes.** Process-kind handling and directory-group filters apply consistently. <!-- cite: PR 829, PR 834 -->

### Supplies & items
- **Supplies and items.** Receive supplies and attach them to a process; Supplies and Items are separate pages with their own filters; items use a standard master/detail layout; toggle between available and consumed; full provenance (genealogy) tree for any item; output items can be graded; item splitting works with fractional spec quantities; create and update edits persist reliably. <!-- cite: PR 715, PR 724, PR 725, PR 733, PR 832, PR 840, PR 841, PR 842 -->

### Orders, repacking, allocation
- **Orders.** Browse and edit orders with their lines and process assignments, run the operations that fulfil them, reserve specific items, switch between active and completed, restrict the new-order form to operation processes, save updates that touch multiple processes, and a reorganised detail panel with scalar fields and tabbed relation tables. <!-- cite: PR 720, PR 721, PR 722, PR 726, PR 731, PR 736, PR 843, PR 845 -->
- **Allocation.** Pick which items are allocated to which order line in a modal so you don't lose context. <!-- cite: PR 839, PR 846 -->
- **Repacking.** Move contents from one tare into another and generate the resulting items; the tare picker reflects what's physically in the tare, including barcodes. <!-- cite: PR 3, PR 838, PR 849 -->

### Operator desktop
- **Operator desktop.** Single-screen UI for shop-floor operators to receive, repack and complete operations; resizable master / detail panes; the Done step closes out the active task; validation alerts appear over the form rather than pushing it down. <!-- cite: PR 7, PR 8, PR 735, PR 847 -->

### Authorisation
- **Sign-in and groups.** Logistics uses the platform's login flow; users belong to multiple groups and permissions add up. <!-- cite: PR 758, PR 819, PR 823 -->

### Polish & infrastructure
- **Polish.** Initial page layouts and icon-aligned navigation; long directories use lazy-loaded grids instead of paginated ones; the project starts cleanly in dev or production without per-developer config. <!-- cite: PR 709, PR 710, PR 713, PR 714, PR 816 -->
