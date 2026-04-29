# Board Profile & Mux Driver — User Changes

This plugin contributes:

- the **Board** profile (`profiles/board`) — define a sequence of board commands and instructions and what parameters each one returns;
- the **Mux board** driver (`drivers/mux`) — drives the 20-socket MUX board over a serial port, executing the plan generated from a Board profile.

## v1.13.0

- **Async serial-port pipeline** (PR 700, PR 701, PR 702, PR 703). Reads and writes are fully async, a configurable pre-instruction gap stops the board from missing leading characters on slow lines, and in-flight Mux jobs are stopped synchronously when an operation completes or is cancelled — so the next run starts on a clean port.
- **Diagnostics & response handling** (PR 655, PR 757, PR 787). Instruction responses carry their raw length, driver options accept multi-line responses, and a Test-Mux command runs a synthetic plan to verify wiring without launching a real operation.
- **Race fix on operation start** (PR 788). Multiple workbench devices starting at the same instant no longer overwrite each other's parameters.

## v1.0.0

- **Plugin introduced** (PR 282, PR 286, PR 376). Author Board profiles with typed parameters and run them via the Mux driver.
- **Defensive command pipeline** (PR 571, PR 580, PR 584, PR 600, PR 603, PR 605, PR 625). KZ uses dedicated routing so its response or timeout doesn't break the rest of the plan; bad or missing board responses produce `null` parameters instead of crashing the operation; profile commands without an instruction are silently skipped during param-extraction and execution; per-instruction wait offsets stop dropped early replies.
- **Profile-driven start parameters** (PR 590). Values typed into the New-Operation wizard reach the board plan as named parameters.
- **Submit / Cancel discipline** (PR 597). Driver-options buttons stay disabled and grey until something actually changes.
