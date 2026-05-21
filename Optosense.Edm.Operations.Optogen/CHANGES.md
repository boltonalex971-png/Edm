# Optogen App — User Changes

Optogen (`apps/optogen`) is the general operator UI. It runs while a job is in progress, shows the live device readings, accepts operator input, and relays parameters to and from drivers.

## v1.13.0

- **More reliable parameter handover.** Round-trips with drivers no longer drop parameters, and operator actions submitted in Optogen survive a reload of the screen. <!-- cite: PR 723, PR 809 -->

## v1.12.0

- **Per-output number formatting.** Pick a precision and format for each output, with sensible defaults so a newly created operation starts formatted; parameter names with non-ASCII characters are now saved correctly. <!-- cite: PR 542, PR 543, PR 544 -->
- **Operation number in header.** The header shows which operation the screen belongs to — useful when several are open. <!-- cite: PR 545 -->
- **Universal control panel.** Start / Cancel / Done bar shared with the other operation apps. <!-- cite: PR 558 -->

## v1.0.0

- **Plugin introduced.** A single configurable operator UI per operation, replacing the per-device operator screens. <!-- cite: PR 435 -->
- **Output-parameter UX.** Fixed-list outputs use a combobox; numeric values are no longer forced to two decimals. <!-- cite: PR 458, PR 463 -->
- **Reliable defaults and saves.** Optogen options open without a settings record present, save reliably, and show profile names rather than GUIDs in workbench devices. <!-- cite: PR 438, PR 442, PR 461 -->
- **Repeatable operator step.** Steps marked repeatable in the Operator profile keep accepting input until the operator advances. <!-- cite: PR 439 -->