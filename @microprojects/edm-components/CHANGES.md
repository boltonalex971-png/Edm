# @microprojects/edm-components — Changes

## 0.1.0 — initial scaffold (Phase 1)

Phase-1 lift of v2 primitives from `Microprojects.Edm.Ui.Technologies/Ui/src/`. Lifts are TypeScript-converted (no logic refactor) per the extraction plan.

- Package scaffolded with rslib (mirrors `@microprojects/tools` config) plus `@rsbuild/plugin-sass` for `.module.scss` compilation.
- Entries: `components`, `hooks`, `styles`, `utils`, plus `styles/chrome.css` and `styles/tokens.css` side-channels.
- Style contract documented in `STYLE_CONTRACT.md`.

### Carry-overs to address in Phase 2

- Refactor `_render`/`_renderFunc`/`_selectedItem` global mutation in `TreeViewMaster` and `MasterDetail` to a context-based imperative handle.
- Add `onActivity()` callback to `useConnectionState` so consumers can refresh `lastSeen` from observed traffic.
- Make `UiPreferencesProvider` storage injectable (sessionStorage / no-op) and storage-key prefix configurable.
- Re-evaluate `Toast` API (position, action, persistent, queue) when comparing with Logistics's `InlineAlert`.
