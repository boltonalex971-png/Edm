# REST API Driver — User Changes

The REST API driver lets EDM read and write parameters on any HTTP/REST device.
The plugin ships two UIs: the **profile editor** (`profiles/restapi`) for declaring
endpoints and parameters, and the **driver options editor** (`drivers/restapi`)
shown when the driver is attached to a workbench device.

## v1.13.22

- **Memory-leak fix** (PR 837). Long-running operations that use the REST API driver no longer accumulate memory between requests.

## v1.13.0

- **Parameter handshake hardened** (PR 717, PR 718). Each request is paired with its response before the next is issued, and the long-poll parameter was renamed to be unambiguous in profile JSON.

## v1.12.0

- **Plugin introduced** (PR 582). Configure REST endpoints in the profile, attach the driver to a device, and EDM will call the configured GET/PUT/POST to fetch or push parameters during an operation.
- **Submit / Cancel discipline** (PR 597). Driver-options buttons stay disabled and grey until something actually changes.
