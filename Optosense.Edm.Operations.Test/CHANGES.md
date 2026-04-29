# Test Operations Plugin — User Changes

This plugin contributes two operation UIs:

- **General** (`apps/test`) — a generic harness used to exercise a process during integration / acceptance;
- **TypeOne** (`apps/typeone`) — a sensor-current consumption check, including the MipTech variant.

Both run in the operation window while a job is active.

## v1.13.0

- **TypeOne UX overhaul** (PR 786, PR 789, PR 808, PR 810, PR 812). Cleaner layout with larger live readings, per-sensor pass/fail badge, real-time log pane next to the sensor grid, and modernised SignalR / inter-frame messaging for snappier updates; the indicator now follows the latest reading even when readings arrive out of order.
- **Sensor poll cap** (PR 778). When a profile asks for more sensor reads per second than the device delivers, extra polls are dropped instead of queueing forever.

## v1.12.5

- **Live-screen & settings fixes** (PR 587, PR 599, PR 601). TypeOne options persist on Save, the live screen shows all configured sensors after a recent regression, and skipped sensors are drawn as skipped instead of failed.
- **Universal control panel** (PR 558). Start / Cancel / Done bar shared with Optogen and the Main app.

## v1.12.0

- **MipTech polish** (PR 583, PR 588, PR 592). The log auto-scrolls to the latest entry, passing sensors are coloured green, each run records the unit's serial number in the report, and live readings re-render with less flicker during long runs.
- **TypeOne config slot** (PR 570). TypeOne picks up its sensor and limits config from the operation profile.

## v1.0.0

- **App framework introduced** (PR 225, PR 229). Pluggable per-operation app framework with a generic Test app as the first consumer.
- **Audit zones from templates and live driver awareness** (PR 284, PR 294). The app reads audit zones from the active template and sees plugged devices and their profile parameters live during a run.
