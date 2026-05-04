# Logistics App — User Changes

The Logistics app (`/logistics`) covers nomenclature, tare, supplies, items, orders, repacking, allocation, the operator desktop, and the manufacturing process tree. It was added in v1.13.0 and has been the focus of most recent work.

## v1.13.26

- **Auto-incremented order number** (PR 28, PR 35). New orders get a sequential number on save (preserving the format of the previous order — `1`, `2`, …, or zero-padded prefixed forms like `ORD-0043`); the order detail shows it as a `#<number>` heading and it surfaces on the desktop order list, item detail and genealogy tree nodes. Orders without a positive Amount are rejected at save with a clear error.
- **Order UX polish** (PR 31, PR 32, PR 33, PR 34). The order list refreshes when an order is created or completed; after a successful Create, the right panel flips from the New-Order form to a view of the just-created order; the allocate-output target tare type pre-fills from the nomenclature's default; the tare-detail panel opened from an order tab uses the order's pre-loaded items so its capacity figure matches the row summary (no more double-counting of allocation splits); an empty Output tab shows "Not executed yet" instead of being blank.
- **Item genealogy redesign** (PR 30). Genealogy tree nodes show item details on hover, edges are colour-coded by origin (output, store, supply, split), and items created directly without a supply or parent are flagged with a "store" origin.
- **Item lifecycle: immutable quantity** (`8fd3ce9`). `Item.Quantity` is fixed at creation and never decremented — consumption is tracked only via `ItemLink` — so executed orders keep their original allocation visible in history; tare-fill and order-allocation calculations correctly account for partially-consumed items, and the items-count noise in notifications is gone.
- **Datetimes in local format** (PR 27). Date and date-time fields across orders, supplies, the operator desktop, folder details and relation tables render in your locale format; UTC timestamps from the backend are normalised before parsing so they no longer drift by your local offset.
- **Per-type root folder** (PR 26). Nomenclature, tare type, and each process kind (Manufacturing, Technology, Operation) each open at their own pre-seeded root in the directory tree, so a new entry lands under the right root automatically.
- **Schema-entity versioning with auto-fork** (PR 24). When you save a non-trivial edit to a tare type, nomenclature or process that already has live or historical references, the UI prompts to fork — the edit becomes a new version, the original is frozen, and existing items, orders and history continue to render against the version they were created under. Trivial edits (Name, Description) still mutate in place.
- **Cross-user refresh & locks** (PR 19, PR 22, PR 23). Changes made by another user propagate to your open Master/Detail views and tabs over a Logistics SignalR channel; the Detail toolbar's Copy and Delete are disabled (with a "Locked by …" tooltip) while another user holds the lock; folder-notification cross-talk now correctly invalidates every leaf-type master view, not just the one matching the folder's own type.
- **Master-tree fixes** (PR 20, PR 21). Drag-and-drop target indices are resolved against the rendered (filtered) tree instead of the raw data, so drops land on the intended folder; the per-tree root state lives in a per-instance React context so navigating between process kinds no longer drops new items into the previous view's folder.

## v1.13.22

- **First-run data on empty DB** (PR 4, PR 15). Setup seeds default nomenclatures, tare types and processes so the app is usable out of the box; the EF bundle now runs Logistics migrations alongside the rest of the app, no manual step.
- **Tare filtering and store provenance** (PR 11, PR 12, PR 14). Operators only see tare types and barcodes the active nomenclature allows and that the user's groups permit; items created directly (with no supply, no producing process and no parent link) are flagged as a "store" origin in the item detail and genealogy tree.
- **Picker quality** (PR 10, PR 13). All directory pickers use a hierarchical drop-down tree respecting user-group policies; popups widen to the longest entry so values aren't truncated.

## v1.13.0 — first release

### Directories
- **Nomenclature & tare directories** (PR 711, PR 712, PR 727, PR 734, PR 9). Full CRUD for nomenclature and tare types with fractional quantities and units displayed inline, plus a bidirectional link between them — edit the relation from either side.
- **Empty folders hidden in pickers** (PR 826). Keeps the directory tree readable.

### Processes & specifications
- **Process tree** (PR 708, PR 716, PR 824, PR 827, PR 828, PR 831, PR 833, PR 835, PR 836). Manufacturing-process directory with type / parent / configuration; per-process specification tab and grades on technology processes; processes presented as separate trees by kind with hidden roots; the parent picker only offers child types it allows; Manufacturing tree opens by default in Settings; new-order picker is a drop-down tree, not a flat list.
- **Process bug-fixes** (PR 829, PR 834). Process-kind handling and directory-group filters apply consistently.

### Supplies & items
- **Supplies & items** (PR 715, PR 724, PR 725, PR 733, PR 832, PR 840, PR 841, PR 842). Receive supplies and attach them to a process; Supplies and Items are separate pages with their own filters; items use the standard master/detail architecture; toggle between available and consumed; full provenance (genealogy) tree for any item; output items can be graded; item splitting works with fractional spec quantities; create/update edits persist reliably.

### Orders, repacking, allocation
- **Orders** (PR 720, PR 721, PR 722, PR 726, PR 731, PR 736, PR 843, PR 845). Browse and edit orders with their lines and process assignments, run the operations that fulfil them, reserve specific items, switch between active and completed, restrict the new-order form to operation processes, save updates that touch multiple processes, and a reorganised detail panel with scalar fields and tabbed relation tables.
- **Allocation** (PR 839, PR 846). Pick which items are allocated to which order line in a modal so you don't lose context.
- **Repacking** (PR 3, PR 838, PR 849). Move contents from one tare into another and generate the resulting items; the tare picker reflects what's physically in the tare, including barcodes.

### Operator desktop
- **Operator desktop** (PR 7, PR 8, PR 735, PR 847). Single-screen UI for shop-floor operators to receive, repack and complete operations; resizeable master / detail panes; the Done step closes out the active task; validation alerts appear over the form rather than pushing it down.

### Authorisation
- **Auth schema and groups** (PR 758, PR 819, PR 823). Logistics uses the platform's new login flow with JWT-cookie identity; users belong to multiple groups and permissions cumulate.

### Polish & infrastructure
- **Polish** (PR 709, PR 710, PR 713, PR 714, PR 816). Initial page stubs and icon-aligned navigation; lazy-loaded grids replace paginated ones for long directories; generic backend for directory pages; project starts cleanly in dev or prod without per-developer config.
