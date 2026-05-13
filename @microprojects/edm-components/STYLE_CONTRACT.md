# Style contract

Every component in this package reads CSS custom properties (design tokens) instead of baking colours, spacing, typography, or radii into its stylesheet. Consumers MUST define every variable below on a selector that wraps the rendered components — usually `.page-root` or `:root`.

The package ships a default token sheet at `dist/styles/tokens.css` (lifted from the Technologies v2 design). To adopt the defaults wholesale:

```ts
import '@microprojects/edm-components/styles/tokens.css';
```

To override individual tokens, define them on a selector that wins the cascade (later import order, higher specificity, or a more-nested selector). The Technologies plugin uses its own `src/tokens.css` and does not import the package default.

## Variable surface

### Signal palette
| Variable             | Default (light) | Use                      |
| -------------------- | --------------- | ------------------------ |
| `--sig-run`          | #0EA968         | running / active / OK    |
| `--sig-run-soft`     | #DFF6E9         | tinted background        |
| `--sig-run-deep`     | #06673F         | strong text              |
| `--sig-warn`         | #E89E1A         | warning / attention      |
| `--sig-warn-soft`    | #FCEFD2         |                          |
| `--sig-warn-deep`    | #8A5C03         |                          |
| `--sig-fault`        | #D63838         | error / fault / blocked  |
| `--sig-fault-soft`   | #FCE3E3         |                          |
| `--sig-fault-deep`   | #8A1818         |                          |
| `--sig-info`         | #1F77E0         | info / link              |
| `--sig-info-soft`    | #DCEAFB         |                          |
| `--sig-idle`         | #6B7787         | idle / paused / neutral  |
| `--sig-idle-soft`    | #E8EBEF         |                          |
| `--sig-idle-deep`    | #2F3947         |                          |
| `--sig-queued`       | #8B5CF6         | queued / scheduled       |
| `--sig-queued-soft`  | #ECE5FF         |                          |
| `--accent`           | #1F4DE5         | brand accent (cobalt)    |
| `--accent-deep`      | #36488A         |                          |
| `--accent-soft`      | #DEE3F2         |                          |
| `--accent-tint`      | #F2F5FF         | flash background tint    |

### Entity hues (used by `TreeViewMaster` icons)
Pairs of `--hue-{name}-soft` and `--hue-{name}-deep` for: `azure`, `cobalt`, `indigo`, `violet`, `plum`, `mauve`, `jade`, `teal`, `amber`, `ochre`, `rose`, `slate`. Plugins map their own entity types to a hue in their own override layer.

### Surface / ink
| Variable           | Use                              |
| ------------------ | -------------------------------- |
| `--bg`             | page background                  |
| `--surface`        | card / panel surface             |
| `--surface-2`      | inset / muted surface            |
| `--surface-3`      | code / tag / chip background     |
| `--surface-sunk`   | recessed surface                 |
| `--ink-1`          | headings                         |
| `--ink-2`          | body                             |
| `--ink-3`          | secondary                        |
| `--ink-4`          | muted / captions                 |
| `--ink-disabled`   | disabled text                    |
| `--line`           | hairline borders                 |
| `--line-soft`      | softer borders                   |
| `--line-strong`    | input borders                    |
| `--line-vivid`     | high-contrast borders            |

### Layout / sizing
The layout tokens hold the **compact baseline** — every other density is
produced by scaling, not by per-token overrides.

| Variable           | Value (compact base) |
| ------------------ | -------------------- |
| `--row-h`          | 32px                 |
| `--row-pad-x`      | 10px                 |
| `--field-h`        | 30px                 |
| `--btn-h`          | 30px                 |
| `--section-pad`    | 14px                 |
| `--card-pad`       | 14px                 |
| `--density-zoom`   | 1 (mirrors current density) |

Density is selected by adding the class `density-compact` / `density-comfortable` / `density-touch` to the page root. Each class sets a `zoom` factor (and the matching `--density-zoom` variable) on the page-root subtree, so **every element on the page** — text, padding, borders, icons, the tokens above, and any hard-coded pixel values inside component CSS — scales together:

| Density        | `zoom`   | Step over compact |
| -------------- | -------- | ----------------- |
| compact        | 1        | base              |
| comfortable    | 1.15     | +15%              |
| touch          | 1.3225   | +15% (1.15²)      |

Because `zoom` scales the element's own layout box, viewport-relative shell dimensions (e.g. `.page-root { min-height: 100vh }`) must be pre-divided by `var(--density-zoom, 1)` to keep the chrome viewport-sized at every density.

### Radii / typography / motion / elevation / z-index
- `--r-1`, `--r-2`, `--r-3`, `--r-4`, `--r-pill`
- `--font-sans`, `--font-mono`, `--font-icon`
- `--t-11` … `--t-56`, `--track-eyebrow`, `--track-tight`
- `--ease-std`, `--ease-in`, `--ease-out`, `--dur-1` … `--dur-4`
- `--elev-1`, `--elev-2`, `--elev-3`, `--elev-popover`
- `--z-rail`, `--z-header`, `--z-popover`, `--z-modal`, `--z-toast`

### Scheme
- `data-scheme="light|dark"` on the page root selects a colour scheme. The package CSS only **reads** the attribute. Consumers provide the dark-mode overrides (Tech currently keys dark off `.theme-shop` — see `tokens.css` defaults).

## Class hooks the package emits

The components apply density and scheme hooks via attributes/classes the consumer is expected to set on the page root:

- `.page-root` — the recommended root class. Components inside reach up via `:where(.page-root) ...` selectors.
- `.density-compact|comfortable|touch` — selects the active density token set.
- `data-scheme="light|dark"` — selects the active colour scheme.
- `data-role="..."` — opt-in: plugins map their user role to a role attribute and override accent / chrome hues per role. The package itself does not assume any specific role values.

## Adding a token

When adding a new component that needs a token not on the list above:

1. Add the variable to `src/styles/tokens.css` with a sensible default.
2. Document it in this file under the matching section.
3. Bump the package minor version on next release — adding a token is a contract addition consumers may want to override.
