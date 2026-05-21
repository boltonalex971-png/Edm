# Operator Plugin — User Changes

The Operator plugin lets a human stand in for any device. It contributes:

- the **Operator** profile (`profiles/operator`) — declare the steps the operator must perform, with input/output parameters and conditions;
- the **Operator** driver (`drivers/operator`) — attach to a workbench device to capture human input where hardware would normally answer;
- the **Operator** operation screen (`apps/operator`) — what the operator sees while a job is running.

## v1.13.0

- **Smoother device lifecycle.** Fewer stuck devices, faster cancel, and finishing the device after the last operator step now closes the operation cleanly instead of leaving it in "waiting" state. <!-- cite: PR 756, PR 809, PR 814 -->
- **Driver hand-off fixed.** Round-trip with the OPC UA driver and the Optogen screen no longer drops values. <!-- cite: PR 723 -->

## v1.12.0

- **TypeOne integration hook.** The plugin exposes a configuration slot that the TypeOne app uses to map operator steps onto sensor checks. <!-- cite: PR 570 -->

## v1.0.0

- **Plugin introduced.** Replace any device in a process with a human who performs manual steps and submits readings. <!-- cite: PR 381 -->
- **Step authoring.** Steps support conditions over earlier parameters, deadlines with a live countdown, repeatable submission, and access to other parameters on the same device; a condition that references an unset parameter now evaluates to false instead of throwing. <!-- cite: PR 429, PR 433, PR 434, PR 439, PR 440 -->
- **Operator answers in the report.** Answers fold back into the operation's parameters just like device readings, and each answer carries a `ResponseTime` value that shows up in the audit/report. <!-- cite: PR 384, PR 432 -->
- **Cancellation fixed.** Cancelling an operation that is waiting on an operator step no longer hangs the job. <!-- cite: PR 388 -->
