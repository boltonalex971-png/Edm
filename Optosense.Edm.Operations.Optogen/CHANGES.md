# Optogen App — User Changes

Optogen (`apps/optogen`) is the general operator UI. It runs while a job is in progress, shows the live device readings, accepts operator input, and relays parameters to and from drivers.

## v1.13.0

- **Async API & Main-app handover** (PR 723, PR 809). Round-trip with the OPC UA and Operator drivers no longer drops parameters; operator actions submitted in Optogen are persisted by the Main app, so they survive a reload of the Optogen frame.

## v1.12.0

- **Number formatter** (PR 542, PR 543, PR 544). Per-output precision/format with sensible defaults so a newly created operation starts formatted; custom param names with non-ASCII characters now persist.
- **Operation number in header** (PR 545). The header shows which operation the screen belongs to — useful when several are open.
- **Universal control panel** (PR 558). Start / Cancel / Done bar shared with the other operation apps.

## v1.0.0

- **Plugin introduced** (PR 435). Single configurable operator UI per operation, replacing the per-device operator screens.
- **Output-parameter UX** (PR 458, PR 463). Fixed-list outputs use a combobox; numeric values are no longer forced to two decimals.
- **Reliable defaults & saves** (PR 438, PR 442, PR 461). Optogen options open without a settings record present, save reliably, and show profile names rather than GUIDs in workbench devices.
- **Repeatable operator step** (PR 439). Steps marked repeatable in the Operator profile keep accepting input until the operator advances.
