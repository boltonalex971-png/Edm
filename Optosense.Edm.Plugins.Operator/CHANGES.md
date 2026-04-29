# Operator Plugin — User Changes

The Operator plugin lets a human stand in for any device. It contributes:

- the **Operator** profile (`profiles/operator`) — declare the steps the operator has to perform, with input/output parameters and conditions;
- the **Operator** driver (`drivers/operator`) — attach to a workbench device to capture human input where hardware would normally answer;
- the **Operator** operation UI (`apps/operator`) — the screen the operator uses while a job is running.

## v1.13.0

- **Async device lifecycle** (PR 756, PR 809, PR 814). The Operator driver follows the same async start/cancel/notify path as other drivers — fewer stuck devices, faster cancel, and completing the device after the last operator step now closes cleanly instead of leaving the operation in "waiting" state.
- **Driver hand-off fixes** (PR 723). Round-trip with the OPC UA driver and the Optogen UI is repaired.

## v1.12.0

- **TypeOne config slot** (PR 570). The plugin exposes a configuration hook that the TypeOne app uses to map operator steps onto sensor checks.

## v1.0.0

- **Plugin introduced** (PR 381). Replace any device in a process with a human performing manual steps and submitting their readings.
- **Step authoring** (PR 429, PR 433, PR 434, PR 439, PR 440). Steps support conditions over earlier parameters, deadlines with a live countdown, repeatable submission, and access to other parameters on the same device; conditions referencing an unset parameter evaluate as false instead of throwing.
- **Operator answers integrated** (PR 384, PR 432). Answers fold back into the operation's parameter set just like device readings, and each answer carries a `ResponseTime` parameter that surfaces in the audit/report.
- **Cancellation fix** (PR 388). Cancelling an operation that's waiting on an operator step no longer hangs the job.
