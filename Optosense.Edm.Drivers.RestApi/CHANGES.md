# REST API Driver — User Changes

The REST API driver lets EDM read and write parameters on any HTTP/REST device. The plugin ships two screens: the **profile editor** (`profiles/restapi`) for declaring endpoints and parameters, and the **driver-options editor** (`drivers/restapi`) shown when the driver is attached to a workbench device.

## v1.13.22

- **Memory leak fixed.** Long-running operations that use the REST API driver no longer accumulate memory between requests. <!-- cite: PR 837 -->

## v1.13.0

- **More reliable parameter exchange.** Each request now waits for its response before the next one is sent, and the long-poll parameter has a clearer name in the profile. <!-- cite: PR 717, PR 718 -->

## v1.12.0

- **Plugin introduced.** Declare REST endpoints in the profile, attach the driver to a device, and EDM will call the configured GET/PUT/POST to read or write parameters during an operation. <!-- cite: PR 582 -->
- **Submit and Cancel behave predictably.** The driver-options buttons stay disabled and greyed out until you actually change something. <!-- cite: PR 597 -->
