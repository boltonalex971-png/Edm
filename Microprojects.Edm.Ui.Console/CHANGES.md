# Host Console — User Changes

The Host Console (`/console`) shows what is happening on a single EDM host: attached devices, drivers, available and running jobs, and the live log.

## v2.0.0.0

- **Refreshed look matching the rest of the platform.** Console now uses the same colours, fonts, density and spacing as Technologies and Logistics. <!-- cite: PR #69 -->
- **Density toggle scales the whole window.** Compact, Comfortable and Touch now resize text, spacing and icons together — pick the density that matches your screen and the entire UI follows. <!-- cite: PR #65 -->
- **Console can also live inside the Hub.** The same Console screens are available standalone at `/console` or embedded as tabs inside the Hub, with a host-connection badge in the header in both cases. <!-- cite: PR #54 -->

## v1.0.0

- **Per-host view of devices, drivers, jobs and the live log.** Lists update in real time; a state indicator shows whether the host is reachable. <!-- cite: PR 309, PR 443 -->
- **Job-aware terminology.** Operations contain jobs; jobs target devices. Existing dashboards continue to work. <!-- cite: PR 344, PR 347 -->
