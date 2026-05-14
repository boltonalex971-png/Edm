# Host Console — User Changes

The Host Console (`/console`) shows what is happening on a single EDM host: attached devices, drivers, available and running jobs, and the live log.

## v2.0.0.0

- **Layout cleanup — shared chrome and footer / token rewire** (PR #69). The Console SPA's shell is rebuilt on the shared `@microprojects/edm-components` chrome and no longer carries its own 926-line `tokens.css`, custom Header / Footer components or local theme — the same package primitives that drive Technologies and Logistics now render Console's shell. The lingering "Main" chip in the footer is gone, and Console's `MetaController` exposes the same version / changelog / about endpoints as the other application plugins.
- **Density toggle now resizes the entire UI** (PR #65). Compact, Comfortable and Touch densities used to nudge a handful of row and field tokens; they now apply a `zoom` factor to the page root (Compact = baseline, Comfortable +15%, Touch +32%) so text, padding, icons and any hard-coded pixel sizes scale together. The viewport height is pre-divided by the active zoom so the shell stays exactly viewport-sized.
- **Console redesign — standalone or Hub-embedded** (PR #54). The Console SPA is rebuilt on Rsbuild with a sidebar / header / footer shell, refreshed design tokens, an embedded-tabs mode that the Hub host can drive via `postMessage`, and a status badge that reflects the host connection. The three sections (Drivers, Jobs, Log) live on their own pages with a unified data-table layout; the same build serves both the standalone Console URL and the Hub-embedded panel.

## v1.0.0

- **Plugin introduced with live data** (PR 309, PR 443). Per-host UI showing devices, drivers, jobs and the live log, with a state indicator that reflects whether the host is reachable; lists update from the host in real time instead of being static.
- **Jobs vocabulary** (PR 344, PR 347). Console aligned with the new "jobs" terminology used elsewhere in EDM (operations contain jobs, jobs target devices); existing dashboards keep working.
