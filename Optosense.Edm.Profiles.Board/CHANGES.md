# Board Profile & Mux Driver — User Changes

This plugin contributes:

- the **Board** profile (`profiles/board`) — define a sequence of board commands and instructions and what parameters each one returns;
- the **Mux board** driver (`drivers/mux`) — drives the 20-socket MUX board over a serial port, executing the plan generated from a Board profile.

## v2.0.2

- **Profile editor loads and saves again.** The board profile editor and its instructions list now use the correct address, so opening and saving a profile work after the recent API path changes. <!-- cite: PR #81 -->

## v1.13.0

- **Smoother serial-port behaviour on slow lines.** A configurable pre-instruction gap stops the board from missing leading characters, and in-flight Mux jobs stop cleanly when an operation completes or is cancelled, so the next run starts on a clean port. <!-- cite: PR 700, PR 701, PR 702, PR 703 -->
- **Better diagnostics and response handling.** Multi-line board responses are accepted, and a Test-Mux command runs a synthetic plan so you can verify wiring without launching a real operation. <!-- cite: PR 655, PR 757, PR 787 -->
- **Fixed a race when starting an operation.** Multiple workbench devices starting at the same instant no longer overwrite each other's parameters. <!-- cite: PR 788 -->

## v1.0.0

- **Plugin introduced.** Author Board profiles with typed parameters and run them via the Mux driver. <!-- cite: PR 282, PR 286, PR 376 -->
- **More defensive command pipeline.** A failed or timed-out KZ command no longer breaks the rest of the plan; bad or missing board responses produce empty parameters instead of crashing the operation; profile commands without an instruction are skipped silently; per-instruction wait offsets stop dropped early replies. <!-- cite: PR 571, PR 580, PR 584, PR 600, PR 603, PR 605, PR 625 -->
- **Profile-driven start parameters.** Values typed into the New-Operation wizard reach the board plan as named parameters. <!-- cite: PR 590 -->
- **Submit / Cancel discipline in driver options.** Buttons stay disabled and grey until something actually changes. <!-- cite: PR 597 -->