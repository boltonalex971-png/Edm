# Host Console — User Changes

The Host Console (`/console`) shows what is happening on a single EDM host: attached devices, drivers, available and running jobs, and the live log.

There are no console-specific user changes after v1.0.0 — subsequent commits only follow platform-wide migrations.

## v1.0.0

- **Plugin introduced with live data** (PR 309, PR 443). Per-host UI showing devices, drivers, jobs and the live log, with a state indicator that reflects whether the host is reachable; lists update from the host in real time instead of being static.
- **Jobs vocabulary** (PR 344, PR 347). Console aligned with the new "jobs" terminology used elsewhere in EDM (operations contain jobs, jobs target devices); existing dashboards keep working.
