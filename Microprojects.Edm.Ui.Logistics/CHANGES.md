# Logistics App — User Changes

The Logistics app (`/logistics`) covers nomenclature, tare, supplies, items, orders, repacking, allocation, the operator desktop, and the manufacturing process tree. It was added in v1.13.0 and has been the focus of most recent work.

## v1.13.22

- **First-run data on empty DB** (PR 4, PR 15). Setup seeds default nomenclatures, tare types and processes so the app is usable out of the box; the EF bundle now runs Logistics migrations alongside the rest of the app, no manual step.
- **Tare filtering and store provenance** (PR 11, PR 12, PR 14). Operators only see tare types and barcodes the active nomenclature allows and that the user's groups permit; items created on the operator desktop are tagged with the source store.
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
