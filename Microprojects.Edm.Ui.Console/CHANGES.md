# Host Console — User Changes

The Host Console (`/console`) shows what is happening on a single EDM host: attached devices, drivers, available and running jobs, and the live log.

## v2.0.0

- **Console redesign — standalone or Hub-embedded** (PR #54). The Console SPA is rebuilt on Rsbuild with a sidebar / header / footer shell, refreshed design tokens, an embedded-tabs mode that the Hub host can drive via `postMessage`, and a status badge that reflects the host connection. The three sections (Drivers, Jobs, Log) live on their own pages with a unified data-table layout; the same build serves both the standalone Console URL and the Hub-embedded panel.

## v1.0.0

- **Plugin introduced with live data** (PR 309, PR 443). Per-host UI showing devices, drivers, jobs and the live log, with a state indicator that reflects whether the host is reachable; lists update from the host in real time instead of being static.
- **Jobs vocabulary** (PR 344, PR 347). Console aligned with the new "jobs" terminology used elsewhere in EDM (operations contain jobs, jobs target devices); existing dashboards keep working.
