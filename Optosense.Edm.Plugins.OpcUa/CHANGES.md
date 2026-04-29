# OPC UA Driver & Environment Profile — User Changes

This plugin contributes two pieces:

- the **Environment** profile (`profiles/environment`) — define what data to read from an OPC UA server;
- the **OPC UA** driver (`drivers/opcua`) — the device that connects to a server and pulls values for an operation.

## v1.13.0

- **Driver hand-off fixes** (PR 723). Round-trip between the OPC UA driver, the Operator driver and the Optogen UI is repaired — values reach the operator and come back without dropping.

## v1.0.0

- **Plugin introduced** (PR 428). Connect EDM to any OPC UA server, browse and pick nodes from the Environment profile editor, and consume their values as device parameters during operations.
- **Custom and profile-driven parameters** (PR 441, PR 460, PR 461). Add per-driver custom parameters beyond the profile, add a new param from the profile to driver options without a page refresh, and see profile *names* rather than GUIDs in the workbench device list.
- **Robustness fixes** (PR 430, PR 447, PR 463). Unexpected node data types no longer crash the driver, OPC UA sessions are released cleanly on stop so connections don't leak, and numeric output keeps its native type instead of being forced to decimal.
