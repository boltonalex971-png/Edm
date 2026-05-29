# Test Operations Plugin — User Changes

This plugin contributes two operation UIs:

- **General** (`apps/test`) — a generic harness used to exercise a process during integration / acceptance;
- **TypeOne** (`apps/typeone`) — a sensor-current consumption check, including the MipTech variant.

Both run in the operation window while a job is active.

## v2.0.2

- **Operation monitor opens reliably.** Launching the operation's monitor view opens correctly again. <!-- cite: 289e0e9 -->

## v1.13.0

- **TypeOne UX overhaul.** Cleaner layout with larger live readings, a per-sensor pass/fail badge, and a real-time log pane next to the sensor grid; the indicator now follows the latest reading even when readings arrive out of order. <!-- cite: PR 786, PR 789, PR 808, PR 810, PR 812 -->
- **Sensor poll cap.** When a profile asks for more sensor reads per second than the device delivers, extra polls are dropped instead of queueing forever. <!-- cite: PR 778 -->

## v1.12.5

- **Live-screen and settings fixes.** TypeOne options persist on Save, the live screen shows all configured sensors after a recent regression, and skipped sensors are drawn as skipped instead of failed. <!-- cite: PR 587, PR 599, PR 601 -->
- **Universal control panel.** Start / Cancel / Done bar shared with Optogen and the Main app. <!-- cite: PR 558 -->

## v1.12.0

- **MipTech polish.** The log auto-scrolls to the latest entry, passing sensors are coloured green, each run records the unit's serial number in the report, and live readings re-render with less flicker during long runs. <!-- cite: PR 583, PR 588, PR 592 -->
- **TypeOne config from the profile.** TypeOne picks up its sensor list and limits from the operation profile. <!-- cite: PR 570 -->

## v1.0.0

- **App framework introduced.** Pluggable per-operation app framework, with a generic Test app as the first consumer. <!-- cite: PR 225, PR 229 -->
- **Audit zones from templates and live driver awareness.** The app reads audit zones from the active template and sees plugged devices and their profile parameters live during a run. <!-- cite: PR 284, PR 294 -->