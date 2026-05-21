# OPC UA Driver & Environment Profile — User Changes

This plugin contributes two pieces:

- the **Environment** profile (`profiles/environment`) — define what data to read from an OPC UA server;
- the **OPC UA** driver (`drivers/opcua`) — the device that connects to a server and pulls values during an operation.

## v1.13.0

- **Driver hand-off fixed.** Values now travel between the OPC UA driver, the Operator driver and the Optogen screen without being dropped. <!-- cite: PR 723 -->

## v1.0.0

- **Plugin introduced.** Connect EDM to any OPC UA server, browse and pick nodes in the Environment profile editor, and use their values as device parameters during operations. <!-- cite: PR 428 -->
- **Custom and profile-driven parameters.** Add per-driver custom parameters on top of the profile, pick up a new profile parameter in driver options without reloading the page, and see profile *names* instead of GUIDs in the workbench device list. <!-- cite: PR 441, PR 460, PR 461 -->
- **Robustness fixes.** Unexpected node data types no longer crash the driver, OPC UA sessions are released cleanly on stop so connections stop leaking, and numeric output keeps its native type instead of being forced to decimal. <!-- cite: PR 430, PR 447, PR 463 -->
