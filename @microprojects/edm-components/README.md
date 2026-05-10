# @microprojects/edm-components

Reusable React UI primitives shared across the EDM plugin SPAs.

The primitives originate from the Technologies plugin v2 design handoff. This package is the host for primitives that more than one plugin consumes; plugin-specific widgets stay in their own SPA folder.

## Entries

| Entry path                                | Contains                                                                                  |
| ----------------------------------------- | ----------------------------------------------------------------------------------------- |
| `@microprojects/edm-components`           | umbrella re-export of every entry below                                                   |
| `@microprojects/edm-components/components`| `ValueFlash`, `Field`, `Properties`, `EditorSection`, `Toast`, `EmptyState`, `ErrorState`, `LoadingSkeleton`, `Layout`, `NavMenu`, `SubRootPage`, `RelationTable`, `TreeViewMaster`, `MasterDetail`, ... |
| `@microprojects/edm-components/hooks`     | `useGet`, `usePost`, `useFetch`, `useDialog`, `useSignalR`, `useConnectionState`, `getCookie`, `getUserFromToken` |
| `@microprojects/edm-components/styles`    | `UiPreferencesProvider`, `useUiPreferences`, `density.ts`, `scheme.ts`                    |
| `@microprojects/edm-components/utils`     | `displayUserName`, `userInitials`                                                         |
| `@microprojects/edm-components/styles/chrome.css` | structural global classes used by the chrome components (`Layout`, `NavMenu`, `SubRootPage`) |
| `@microprojects/edm-components/styles/tokens.css` | default v2 token sheet — opt-in baseline; consumers override via their own `tokens.css` later in the cascade |

## Style contract

Every component reads design-token CSS variables (`--sig-*`, `--surface*`, `--ink-*`, `--card-pad`, etc.). The contract surface is documented in [`STYLE_CONTRACT.md`](STYLE_CONTRACT.md). Consumers either:

- import the package's default `tokens.css` once at the app root, or
- define every variable themselves on the page-root selector.

## Local consumption (in-repo plugins)

Consume via the `file:` protocol — same pattern as `@microprojects/tools`:

```jsonc
// <plugin>/Ui/package.json
"dependencies": {
    "@microprojects/edm-components": "file:../../@microprojects/edm-components"
}
```

Add the React/MUI/Emotion alias block to the consumer's `rsbuild.config.ts` so the junctioned package resolves the consumer's React copy (avoids dual-React hooks errors).

## Development

```
npm install
npm run dev    # rslib build --watch
```
