# EDM Multi-language (i18n) Spec

Single source of truth for how UI translation is wired across the EDM solution. Read this before changing anything under:

- `Microprojects.Edm.Ui.Logistics/Ui/src/i18n/**`
- any `**/<folder>.locales/*.json` or `<group>/*.{en,ru}.ts` file
- `@microprojects/edm-components/src/i18n/register.ts` (and any new locale module added beside an `edm-<group>` component)
- `@microprojects/edm-components/src/components/master/MasterDetail.tsx` `breadcrumb` / `entityPlural` block
- `@microprojects/edm-components/src/components/chrome/Layout.tsx` footer
- any `rsbuild.config.ts` alias block in a plugin SPA (`i18next` / `react-i18next` aliases)
- locale-aware formatters in `src/utils/format.ts` (`formatLocalDate` / `formatLocalDateTime` / units)

Scope: UI chrome, widget labels, validation/toasts. Out of scope and tracked separately: **entity-content translation** (`Name`/`Description`/`Units` per locale) — see `.claude/plans/logistics-content-i18n.md`. **Backend error codes + `Accept-Language`** are described in §10 but not yet implemented end-to-end.

---

## 1. Library and stack

- **Runtime:** `i18next` (peer `>=23`) + `react-i18next` (`>=14`) + `i18next-browser-languagedetector`.
- **Bundler:** rsbuild / rspack. Locale JSON / TS modules are statically imported and inlined at build time. **rsbuild has no `import.meta.glob`** (that's Vite-only); attempts to use it throw `{}.glob is not a function` at runtime. Always use explicit `import en from './…'` statements.
- **Active locales (2026-05):** `en`, `ru`. ES-ES was staged earlier and removed 2026-05-20. Adding any locale = drop a per-language file beside each existing pair and append it to the `registerNs` / `BUNDLES` flat map.

---

## 2. Architecture

EDM hosts several SPAs (Logistics, Technologies, Console, Hub) plus the `@microprojects/edm-components` package shared between them. Each top-level Application plugin SPA owns its own i18next instance and locale state; the package supplies translations for its own components and is registered into the host's instance at boot.

```
┌─────────────────────────────────────────────────────────────┐
│  Logistics SPA (standalone Application plugin, /logistics)  │
│                                                             │
│  src/i18n/i18n.ts                                           │
│    ├─ creates i18next singleton                             │
│    ├─ LanguageDetector (localStorage → navigator)           │
│    ├─ seeds common + widgets namespaces                     │
│    └─ calls registerEdmComponentsLocales(i18n)              │
│                                                             │
│  components/orders/index.ts ─┐                              │
│  components/items/index.ts   ├─ each calls registerNs(...)  │
│  …                           │  on first import             │
│  components/desktop/index.ts ┘                              │
│                                                             │
│  axios interceptor: Accept-Language: <i18n.language>        │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ resolves
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  @microprojects/edm-components (in-repo, file:)             │
│                                                             │
│  src/i18n/register.ts                                       │
│    BUNDLES = [['edm-chrome','en',chromeEn], ...]            │
│    registerEdmComponentsLocales(i18n)                       │
│      → for each [ns,lng,dict]: i18n.addResourceBundle(...)  │
│                                                             │
│  components/master/MasterDetail.tsx                         │
│    useTranslation('edm-master')                             │
│  components/chrome/Layout.tsx                               │
│    useTranslation('edm-chrome')                             │
│  …                                                          │
└─────────────────────────────────────────────────────────────┘
```

**Key invariant:** the package never creates an i18n instance. It calls `useTranslation()` which reads the same singleton the host initialized. This requires `i18next` and `react-i18next` to be aliased to a single copy in the host SPA's `rsbuild.config.ts` — see §6.

---

## 3. Namespace model

A **namespace** in i18next is a logical grouping of keys. We use one namespace per feature folder (instead of one global namespace, which leaks keys, or one per component, which churns).

### 3.1 Plugin-side namespaces (Logistics)

| Namespace | Where the keys live | Used by |
|---|---|---|
| `common` | `src/i18n/common.locales/{en,ru}.json` | Cross-cutting verbs: `save`, `cancel`, `delete`, `yes`, `no`, `confirm`, `close`, `edit`, `add`, `search`, `loading`, `error`. Seeded day-one — no "promote when used by 3+ components" rule. |
| `widgets` | `src/i18n/widgets.locales/{en,ru}.json` | Flat reusables at `components/*.tsx`: `nav.*`, `role.*`, `language`, `status.*`, etc. |
| `orders` | `components/orders/orders.locales/{en,ru}.json` | Everything in `components/orders/**` |
| `items` | `components/items/items.locales/{en,ru}.json` | Everything in `components/items/**` |
| `supplies` | `components/supplies/supplies.locales/{en,ru}.json` | Everything in `components/supplies/**` |
| `repacking`, `tare`, `transfer`, `desktop`, `homepages` | analogous | one per top-level feature folder |
| `config` | `components/config/config.locales/{en,ru}.json` | `Config.tsx` + `Folder.tsx` (shared) |
| `config/nomenclature` | `components/config/nomenclature/nomenclature.locales/{en,ru}.json` | nomenclature subfolder |
| `config/process` | `components/config/process/process.locales/{en,ru}.json` | process subfolder |
| `config/taretype` | `components/config/taretype/taretype.locales/{en,ru}.json` | taretype subfolder |

The `config/<sub>` namespaces are explicit because they're each their own folder with significant strings; `config` itself stays its own namespace for shared `Folder.tsx` keys (`folder.*`). The `/` in the namespace name is literal — it isn't parsed by i18next.

### 3.2 Package-side namespaces (`@microprojects/edm-components`)

| Namespace | Where the keys live | Used by |
|---|---|---|
| `edm-auth` | `src/components/auth/auth.{en,ru}.ts` | `AuthInterstitial.tsx` |
| `edm-chrome` | `src/components/chrome/chrome.{en,ru}.ts` | `Layout.tsx`, `NavMenu.tsx`, footer |
| `edm-forms` | `src/components/forms/forms.{en,ru}.ts` | `Field`, `Property`, `EditorSection` |
| `edm-master` | `src/components/master/master.{en,ru}.ts` | `Detail`, `Editor`, `Info` (incl. breadcrumb `entityPlural.<type>` map) |
| `edm-page` | `src/components/page/page.{en,ru}.ts` | `SubRootPage`, `Search` |
| `edm-realtime` | `src/components/realtime/realtime.{en,ru}.ts` | live-status pip, etc. |
| `edm-relations` | `src/components/relations/relations.{en,ru}.ts` | `RelationTable` |
| `edm-states` | `src/components/states/states.{en,ru}.ts` | `EmptyState`, `ErrorState`, `Loading`, `Toast` |

**Reserved-character gotcha:** i18next uses `:` as the namespace/key separator (`t('orders:title')`). A namespace name containing `:` (e.g. `edm:chrome`) is silently parsed as the `edm` namespace looking for the `chrome.*` key tree and produces empty translations. **Always use hyphens — `edm-chrome`, not `edm:chrome`.**

### 3.3 Source-of-truth files

Locale dictionaries are JSON in Logistics (`*.locales/en.json`) and TypeScript in `@microprojects/edm-components` (`<group>.en.ts`). The TS form gives static typing for the small dictionary inside the package; consumers and Logistics use JSON because it's the standard i18next-parser target.

JSON files must be **CRLF + no BOM** (rslib's package readers and some TS toolchains reject BOM'd JSON).

---

## 4. Registration flow

### 4.1 Boot sequence

```ts
// src/index.tsx
import './i18n/i18n'  // side-effect — must run before React mounts
// …
createRoot(rootEl).render(<App />)
```

The side-effect import does, in order:

1. `i18n.use(LanguageDetector).use(initReactI18next).init({...})`
   - reads `localStorage.i18nextLng` synchronously during `init`, so the first render is already in the persisted locale (no flash-of-wrong-language).
   - seeds the `resources` object with `common` + `widgets` for each active locale (these two are shipped at app boot so the chrome never goes missing-key).
   - `fallbackLng: 'en'`, `defaultNS: 'common'`, `returnNull: false`.
2. `registerEdmComponentsLocales(i18n)` — package call that iterates a static `BUNDLES` table and calls `i18n.addResourceBundle(lng, ns, dict, true, false)` for each `(edm-<group>, lng)` pair. Idempotent (skips if `hasResourceBundle` returns true).
3. The axios interceptor in `src/index.tsx` later reads `i18n.language` to set `Accept-Language` on every request.

### 4.2 Per-feature-folder registration

Each feature folder owns an `index.ts` that registers its namespace on first import:

```ts
// components/orders/index.ts
import { registerNs } from '@logistics/i18n/registerNs'
import en from './orders.locales/en.json'
import ru from './orders.locales/ru.json'

registerNs('orders', { en, ru })
```

Component files in the folder import `useTranslation('orders')` and pull keys from the namespace. The first time **any** component in the folder is rendered, the route module is imported, which transitively imports the folder's `index.ts`, which fires `registerNs`. The call is idempotent — re-entering doesn't duplicate bundles.

When a component in folder A wants a key from folder B's namespace, it has two options:

- `useTranslation('a')` and use cross-namespace lookup: `t('b:someKey')` — works because folder B's index.ts has been loaded as part of the route graph.
- `useTranslation('b')` to get a B-scoped `t` and use bare keys: `const { t: tB } = useTranslation('b'); tB('someKey')`.

Pick the second for hot loops or when most keys come from B. Pick the first for one-off references.

If folder B has **not** been loaded yet (lazy route boundary, code-split), add an explicit `import './index'` at the top of the consuming file. Side-effect imports register the namespace eagerly.

### 4.3 `registerNs` contract

```ts
// src/i18n/registerNs.ts
export function registerNs(
    ns: string,
    bundles: Record<string, Record<string, unknown>>,
): void {
    for (const [lng, dict] of Object.entries(bundles)) {
        if (i18n.hasResourceBundle(lng, ns)) continue
        i18n.addResourceBundle(lng, ns, dict, true, false)
    }
}
```

- Idempotent (the `hasResourceBundle` guard).
- The map shape is **flat** — `{ en, ru, 'es-ES': esES }`, not a Vite glob result. The TS-property-shorthand-vs-string-key choice has no runtime effect; use whichever reads better.

---

## 5. Russian plurals

i18next ships built-in plural rules. Russian uses **three forms** (`_one`, `_few`, `_many`) keyed off the count integer. Example:

```json
// items.locales/en.json
{
  "slots": "{{placed}} / {{capacity}} slots",
  "orphanSuffix_one": " (+{{count}} orphan)",
  "orphanSuffix_other": " (+{{count}} orphans)"
}
```

```json
// items.locales/ru.json
{
  "slots": "{{placed}} / {{capacity}} мест",
  "orphanSuffix_one": " (+{{count}} осиротевший)",
  "orphanSuffix_few": " (+{{count}} осиротевших)",
  "orphanSuffix_many": " (+{{count}} осиротевших)"
}
```

Call site:

```ts
t('items:orphanSuffix', { count: orphans })
```

Rules:

- Russian: provide all three (`_one`, `_few`, `_many`). Don't ship only `_one`/`_other` for ru — the `_many` form gets used for 0, 5+, and most cases.
- English: `_one` + `_other` (or just a single key for invariant strings). i18next falls back from `_one` for `count = 1` to the bare key for other counts if `_other` is absent — but be explicit.

If a string has interpolation values **without** a count discriminator (e.g. `Saved as {{name}}`), do not use plural suffixes.

---

## 6. Singleton / dual-instance hazard

i18next and react-i18next hold module-level state (active language, registered bundles, the React context). When the host SPA bundles its own copy and the in-repo `@microprojects/edm-components` package ships its own dev `node_modules`, both copies become candidates at module resolution time and rspack picks one per import site. The package's `useTranslation` ends up subscribed to a different instance than Logistics initialized, so:

- `t()` inside package components returns the key string (e.g. literal `edm-master:entityPlural.item`) because the matching bundle was registered on a different singleton.
- `i18n.changeLanguage()` doesn't trigger re-render in package components.

**Fix:** alias both libraries to the host SPA's `node_modules` in every plugin's `rsbuild.config.ts`:

```ts
resolve: {
    alias: {
        // … existing aliases (React/MUI/Emotion/router) …
        i18next:         path.resolve(__dirname, 'node_modules/i18next'),
        'react-i18next': path.resolve(__dirname, 'node_modules/react-i18next'),
    },
},
```

Confirmation that the fix worked: total bundle size drops a few KB (single-copy of both libs); console no longer prints two `WARN react-i18next: react-i18next was already initialized` messages.

This is the same pattern documented in [[reference_local_package_pattern]] for React/MUI/Emotion/router.

---

## 7. Locale detection, persistence, and switching

### 7.1 Detection (boot)

```ts
detection: {
    order: ['localStorage', 'navigator'],
    caches: ['localStorage'],
    lookupLocalStorage: 'i18nextLng',
}
```

- First boot: no `localStorage.i18nextLng`, so the detector reads `navigator.language` (`'ru-RU'`, `'en-US'`, …). i18next maps to the closest `supportedLngs` entry (`'ru-RU'` → `'ru'`, falls back to `fallbackLng: 'en'` for any unmapped value).
- Subsequent boots: `localStorage.i18nextLng` is read; the detector skips navigator.
- `init` is synchronous for static bundles, so the very first paint is in the right locale — no flash.

### 7.2 Switching

User UI lives in the app header (`Layout.tsx` → `extraUserMenuItems` slot on `NavMenu`). Clicking a language:

```ts
i18n.changeLanguage(code)
```

- Fires the `languageChanged` event → `react-i18next` re-renders all `useTranslation` consumers.
- LanguageDetector caches the new value to `localStorage.i18nextLng`.
- The axios interceptor reads `i18n.language` on every subsequent request, so the new locale propagates to backend.

### 7.3 Persistence scope

Logistics's locale state is **local to Logistics** — it does not federate with Hub, Console, or Tech. Each top-level Application plugin owns its own `localStorage.i18nextLng`. (They share a domain so writes are mutually visible, but each plugin reads independently at boot. If a user switches in Logistics, the next visit to Tech still reads Tech's own boot order: localStorage → navigator.)

This is intentional: Application plugins are standalone SPAs, not iframe children — see [[feedback_iframe_no_api_coupling]] for the orthogonal rule about embedded iframes.

---

## 8. Cross-cutting helpers

### 8.1 Locale-aware formatters

`src/utils/format.ts` consolidates date/number/units formatting. Each function reads `i18n.language` instead of hardcoded `'en-GB'`:

```ts
export function formatLocalDateTime(iso: string): string {
    const d = new Date(iso)
    return d.toLocaleString(i18n.language, { ... })
}
```

This means changing the language in the header immediately reflows date columns, timestamp strings, etc. Don't add a new helper that hardcodes a locale; route through `format.ts`.

### 8.2 MUI X DataGrid

`@mui/x-data-grid` has its own locale system. Logistics provides a hook that maps the active i18next language to a built-in MUI X pack:

```ts
// src/i18n/dataGridLocale.ts
import { enUS, ruRU } from '@mui/x-data-grid/locales'

const TABLE = { en: enUS, ru: ruRU } as const

export function useDataGridLocaleText() { /* picks pack + patches gaps */ }
```

Every `<DataGrid>` instance must pass the result:

```tsx
const dgLocaleText = useDataGridLocaleText()
return <DataGrid ... localeText={dgLocaleText} />
```

**Gap patch:** MUI X v8's `ruRU` pack ships `paginationDisplayedRows` commented out, so the footer's "of N" half stays English. The helper layers a Russian template (`{from}–{to} из {count}`) onto the base pack. If another MUI X locale exposes the same gap, add a similar entry to `PAGINATION_DISPLAYED_ROWS_PATCH`.

### 8.3 Detail breadcrumb entity plurals

`@microprojects/edm-components`'s `Detail` component renders a breadcrumb whose trailing crumb is the pluralized entity type (`Items`, `Orders`, `Tares`, …). It looks up `edm-master:entityPlural.<type>` and falls back to an English `pluralize(type)` heuristic for unknown types:

```ts
{(() => {
    const k = displayProps.entityType || displayProps.type;
    return k ? t(`entityPlural.${k}`, pluralize(k)) : pluralize(k);
})()}
```

To add a new entity type's plural label, edit `@microprojects/edm-components/src/components/master/master.{en,ru}.ts` and rebuild the package.

---

## 9. Authoring conventions

### 9.1 Calling `t()`

```tsx
const { t } = useTranslation('orders')
return <Button>{t('addNew')}</Button>
```

Pass an English fallback as the second `t()` arg when the key is new or might not yet be filled in every locale: `t('newKey', 'Add new')`. This is mandatory inside `@microprojects/edm-components` components (so a consumer who skips `registerEdmComponentsLocales` still renders English). It's optional in plugin code, but recommended for keys that ship before translation is filled.

For cross-namespace lookups, prefix with the namespace: `t('common:save')`, `t('widgets:nav.home')`.

For interpolation: `t('saved', { name: data.name })` with `"saved": "Saved {{name}}"`.

For HTML markup inside a translated string, use the `<Trans>` component with positional component slots:

```tsx
<Trans
    i18nKey="folder.emptyMeansEveryone"
    ns="config"
    components={[<b key="0" />]}
/>
```

With `"emptyMeansEveryone": "Empty list means <0>everyone</0> can see this folder."`.

### 9.2 JSON shape

Flat keys, nested only when a section grows past ~15 keys. Plural suffixes follow the i18next convention (`_one/_few/_many/_other`). Example shape:

```json
{
  "title": "Orders",
  "menu": {
    "active": "Active",
    "completed": "Completed"
  },
  "actions": {
    "addNew": "Add new",
    "search": "Search"
  },
  "deleteConfirm": "Delete {{name}}?",
  "amount_one": "{{count}} item",
  "amount_few": "{{count}} items",
  "amount_many": "{{count}} items"
}
```

Don't introduce nested objects deeper than two levels — flat is easier to scan and diff.

### 9.3 What NOT to translate

- Technical units / format identifiers: `'en-GB'` (locale tag in `toLocaleString`), `'EUR'`, `'application/pdf'`, `'data-testid'` attribute values.
- Enum constants (database/API values): `'Running'`, `'Admin'` — these are the **keys**; their translated labels live under `widgets:status.*` / `widgets:role.*`.
- Brand and product names: `EDM`, `Microprojects`, `Logistics` (when appearing as the plugin's own name in the version chip).

If the user-visible string is a technical constant that happens to look like a word, leave it untranslated and add an `// i18n-skip` comment if a lint rule complains.

---

## 10. Backend (error codes + Accept-Language)

### 10.1 Pipeline

**SPA side:** every Application plugin SPA's axios interceptor (and `fetch` shim) sets `Accept-Language: <i18n.language>` on every outbound request.

**Server side:** `Optosense.Edm.WebApi/Extensions/EdmHostBuilderExtensions.cs` wires `AddLocalization()` + `UseRequestLocalization(en, ru)`. The default `AcceptLanguageHeaderRequestCultureProvider` reads the header and sets `CultureInfo.CurrentUICulture` per request. `RequestLocalization` runs **before** `UseAuthentication` so downstream code paths (incl. exception handler) see the right culture.

### 10.2 Error code envelope

`Edm/EdmException.cs` carries a `Code` + `Params` pair in addition to its message:

```csharp
public EdmException(string code, string fallbackMessage)
public EdmException(string code, IReadOnlyDictionary<string,object> @params, string fallbackMessage)
public EdmException(string code, IReadOnlyDictionary<string,object> @params, string fallbackMessage, Exception innerException)
```

`Optosense.Edm.WebApi/Services/GlobalExceptionHandler.cs` projects them onto the response via `ProblemDetails.Extensions`:

```json
{
  "type":   "Bad request",
  "title":  "EdmException",
  "status": 400,
  "detail": "Tare not found.",
  "code":   "Logistics.Tare.NotFound",
  "params": { },
  "instance": "PUT /api/logistics/items"
}
```

If the throwing `EdmException` (or its `InnerException`) lacks a code, the response simply omits the `code`/`params` extensions — the frontend falls back to `detail`.

### 10.3 Code naming and catalog locations

| Prefix | Owner | Catalog location |
|---|---|---|
| `Logistics.*` | `Microprojects.Edm.Ui.Logistics` services + controllers | `Microprojects.Edm.Ui.Logistics/Ui/src/i18n/errors.locales/{en,ru}.json` |
| `Technologies.*` | `Microprojects.Edm.Ui.Technologies` services + jobs | `Microprojects.Edm.Ui.Technologies/Ui/src/i18n/errors.locales/{en,ru}.json` |
| `Board.*` | `Optosense.Edm.Profiles.Board` (driver / plan generator) | replicated in **every** consumer SPA catalog (Logistics + Tech) — Board has no SPA of its own |
| `Edm.Job.*`, `Edm.Plugin.*`, `Edm.Startup.*` | Cross-cutting infrastructure (`Edm/Jobs`, `Microprojects.Edm.Host`, `Microprojects.Edm.Shared/Jobs`) | replicated in every consumer SPA catalog |

Codes are dot-paths under the `errors` namespace. JSON shape is nested-by-segment:

```json
{
  "Logistics": {
    "Tare": {
      "NotFound": "Tare not found."
    }
  }
}
```

The frontend `resolveError(err, fallback)` helper (one per SPA — see Logistics's `src/i18n/resolveError.ts`) does:

```ts
const key = `errors:${data.code}`
if (i18n.exists(key)) return i18n.t(key, data.params ?? {})
return data?.detail || err?.message || fallback
```

### 10.4 Authoring a new code

1. **Pick a path.** `Plugin.Category.Specific` (e.g. `Logistics.Order.NotFound`, `Technologies.Operation.AlreadyFinished`). Reuse existing categories where possible — don't invent a new sub-tree per file.
2. **Add the key** to the owning plugin's `errors.locales/{en,ru}.json` (and to any other consumer SPAs' catalogs if cross-cutting). Use `{{placeholder}}` for interpolation.
3. **Throw with the code:**
   ```csharp
   throw new EdmException(
       "Logistics.Order.NotFound",
       new Dictionary<string, object> { ["orderId"] = orderId },
       $"Order with id {orderId} not found.");
   ```
   For no-params errors, use the 2-arg overload:
   ```csharp
   throw new EdmException("Logistics.Order.AlreadyCompleted", "Order is already completed.");
   ```
4. **Frontend** — no change needed. Any catch block already routed through `resolveError(err, fallback)` translates automatically.

DataAnnotations stay English-only — they don't go through `EdmException`.

---

## 11. Adding a new feature folder — recipe

1. Create `components/<folder>/<folder>.locales/{en,ru}.json` with the keys you plan to use.
2. Create `components/<folder>/index.ts`:
   ```ts
   import { registerNs } from '@logistics/i18n/registerNs'
   import en from './<folder>.locales/en.json'
   import ru from './<folder>.locales/ru.json'
   registerNs('<folder>', { en, ru })
   ```
3. In each component under that folder, `import '../<folder>'` (or `'./index'` if same folder) at the top so the side-effect runs even if the route boundary is code-split.
4. `useTranslation('<folder>')` in components.
5. CRLF + no BOM in the JSON files.

If the folder needs strings from `common` / `widgets` / another folder, use cross-namespace lookup (`t('common:save')`) or call `useTranslation` a second time (`const { t: tCommon } = useTranslation('common')`).

---

## 12. Plugin metadata + ABOUT/CHANGES

Two complementary mechanisms, both keyed off the same `Accept-Language` header that drives error codes (§10).

### 12.1 Plugin Name / Description — i18next-keyed

`PluginAttribute` carries optional `NameKey` / `DescriptionKey` properties alongside the literal `Name` / `Description`:

```csharp
[ApplicationPlugin(
    Name = "Logistics",
    Description = "Product flow from supply to finished item: …",
    NameKey = "Logistics.name",
    DescriptionKey = "Logistics.description",
    Guid = "…",
    SpaPath = "Ui/dist",
    UiRoot = "logistics")]
public class LogisticsUiPlugin : PluginBase, IOperationPlugin { … }
```

The Hub's `/api/hub/plugins` endpoint emits both the literal and the key:

```json
{ "guid": "…", "name": "Logistics", "description": "…",
  "nameKey": "Logistics.name", "descriptionKey": "Logistics.description",
  "homepage": "logistics" }
```

Frontends resolve through the **`plugins`** namespace, falling back to the literal when the SPA's catalog lacks the key:

```ts
const localName = p.nameKey ? tPlugins(p.nameKey, p.name) : p.name
const localDesc = p.descriptionKey ? tPlugins(p.descriptionKey, p.description) : p.description
```

Catalog location: each consuming SPA owns its own `plugins.locales/{en,ru}.json` (Hub is currently the only consumer; if Console / Tech later list plugins, they get their own copy). Shape:

```json
{
  "Logistics": { "name": "Логистика", "description": "Движение продукции от поставки…" },
  "Technologies": { "name": "Технологии", "description": "…" }
}
```

Adding a new plugin: set `NameKey` / `DescriptionKey` in the attribute, drop the entry into Hub's `plugins.locales/{en,ru}.json`. No controller change needed.

### 12.2 ABOUT.md / CHANGES.md — locale-aware resource lookup

Both files are embedded as resources at each plugin's csproj root:

```xml
<EmbeddedResource Include="CHANGES.md" />
<EmbeddedResource Include="CHANGES.*.md" />
<EmbeddedResource Include="ABOUT.md" />
<EmbeddedResource Include="ABOUT.*.md" />
```

Files: `ABOUT.md` + `ABOUT.ru.md` + (optionally) `ABOUT.ru-RU.md`. Same for `CHANGES`. The language-neutral file (`ABOUT.md`) is the English source of truth and the final fallback.

`Edm/Plugins/PluginResource.cs` does the lookup:

```csharp
PluginResource.ReadLocalized(assembly, "ABOUT")  // returns the markdown body or null
```

The lookup walks the `CultureInfo.CurrentUICulture` chain — `ru-RU` → `ru` → invariant — probing `{Asm}.ABOUT.ru-RU.md`, then `{Asm}.ABOUT.ru.md`, then `{Asm}.ABOUT.md`. `UseRequestLocalization` (§10) sets `CurrentUICulture` from `Accept-Language`, so the controller doesn't need any header parsing of its own.

Wiring sites:
- `Hub/Controllers/MetaController.cs` for the hub-served `/api/hub/meta/about` and `/api/hub/meta/changelog`.
- Per-plugin `MetaController.cs` for `/api/<plugin>/meta/changelog`.

Adding a new locale variant: drop `ABOUT.<lng>.md` next to the existing files. No controller or csproj change needed (the glob `*.md` matches automatically).

---

## 13. Adding a new locale — recipe

For locale `<lng>` (e.g. `fr-FR`):

1. Drop `<lng>.json` files beside every existing pair under `src/i18n/{common,widgets}.locales/` and `components/**/*.locales/`. Easiest start: copy the `en.json` files and translate in place.
2. Append the new key to each `registerNs(...)` call:
   ```ts
   import frFR from './orders.locales/fr-FR.json'
   registerNs('orders', { en, ru, 'fr-FR': frFR })
   ```
3. In `src/i18n/i18n.ts`:
   - Add the locale to the `resources` object for `common` and `widgets`.
   - Add it to `supportedLngs`.
4. In `src/components/Layout.tsx`, add a row to `LANGUAGES`:
   ```ts
   { code: 'fr-FR', label: 'Français' },
   ```
5. In `@microprojects/edm-components`, add `<group>.<lng>.ts` modules beside each existing `<group>.{en,ru}.ts` and append them to the `BUNDLES` table in `src/i18n/register.ts`. Rebuild the package.
6. In `src/i18n/dataGridLocale.ts`, import the MUI X built-in pack (e.g. `frFR` from `@mui/x-data-grid/locales`) and add it to `TABLE`. Check whether the pack ships `paginationDisplayedRows`; if not, add a row to `PAGINATION_DISPLAYED_ROWS_PATCH`.

That's it. No rsbuild config change is needed — the new JSON modules are picked up by the static imports.

---

## 14. Trigger files (where to look when changes land here)

- **Boot:** `Microprojects.Edm.Ui.Logistics/Ui/src/i18n/i18n.ts`, `Microprojects.Edm.Ui.Logistics/Ui/src/index.tsx`
- **Per-folder registration:** `Microprojects.Edm.Ui.Logistics/Ui/src/i18n/registerNs.ts`, every `components/**/index.ts`
- **Switcher + language list:** `Microprojects.Edm.Ui.Logistics/Ui/src/components/Layout.tsx`
- **Locale-aware formatters:** `Microprojects.Edm.Ui.Logistics/Ui/src/utils/format.ts`
- **DataGrid localization:** `Microprojects.Edm.Ui.Logistics/Ui/src/i18n/dataGridLocale.ts`
- **Singleton alias guard:** `Microprojects.Edm.Ui.Logistics/Ui/rsbuild.config.ts` (mirror in every plugin SPA)
- **Package boot hook:** `@microprojects/edm-components/src/i18n/register.ts`
- **Package per-group dictionaries:** `@microprojects/edm-components/src/components/<group>/<group>.{en,ru}.ts`
- **Package entry export:** `@microprojects/edm-components/package.json` `exports['./i18n']`
- **Detail breadcrumb plural map:** `@microprojects/edm-components/src/components/master/master.{en,ru}.ts` (`entityPlural` block) + `MasterDetail.tsx` lookup
- **Backend culture pipeline:** `Optosense.Edm.WebApi/Extensions/EdmHostBuilderExtensions.cs` (`AddLocalization` + `UseRequestLocalization`)
- **EdmException ctor + error envelope:** `Edm/EdmException.cs`, `Optosense.Edm.WebApi/Services/GlobalExceptionHandler.cs`
- **Frontend error resolver:** `<plugin>/Ui/src/i18n/resolveError.ts` (one per consuming SPA)
- **Backend error catalogs:** `<plugin>/Ui/src/i18n/errors.locales/{en,ru}.json`
- **Plugin metadata localization:** `Edm/Plugins/PluginAttribute.cs` (`NameKey` / `DescriptionKey`), `Hub/Controllers/PluginsController.cs`, `<plugin>/Ui/src/i18n/plugins.locales/{en,ru}.json` (consumer-side)
- **ABOUT/CHANGES locale lookup:** `Edm/Plugins/PluginResource.cs`, every `<plugin>/Controllers/MetaController.cs`, plus the per-locale `ABOUT.<lng>.md` / `CHANGES.<lng>.md` files at each plugin's csproj root

---

## 15. Common pitfalls

| Symptom | Cause | Fix |
|---|---|---|
| Translations appear as literal key strings (`orders:title`) only inside `@microprojects/edm-components` components | Dual i18next / react-i18next instances | Add aliases to `rsbuild.config.ts` (§6) |
| `Uncaught TypeError: {}.glob is not a function` | rsbuild does not implement `import.meta.glob` | Switch to explicit `import` statements; pass a flat map to `registerNs` |
| Whole namespace renders English even after `changeLanguage('ru')` | The folder's `index.ts` was never imported (lazy route boundary) | Add `import '../<folder>'` to the consuming file |
| Empty translation, no console error | Namespace name contains `:` — i18next parsed it as `ns:key` | Use hyphens (`edm-chrome`, not `edm:chrome`) |
| `paginationDisplayedRows` half-translated ("1–1 OF 1") | MUI X locale pack ships that key commented out | Patch via `PAGINATION_DISPLAYED_ROWS_PATCH` in `dataGridLocale.ts` |
| First paint shows English, then flips to Russian | `i18n.init` happened after React mount | Move the `import './i18n/i18n'` side-effect import above `createRoot` in `src/index.tsx` |
| Cyrillic glyphs render in a fallback font | Google Fonts v2 URL not serving the Cyrillic subset for that weight | Use the v1 URL with explicit `subset=latin,latin-ext,cyrillic,cyrillic-ext` for text fonts; v2 stays only for variable-axis fonts like Material Symbols |
| JSON parser refuses a locale file (rslib, tsc) | UTF-8 BOM was added by the editor / Windows tooling | Strip BOM; keep CRLF |

---

## 16. Out of scope (tracked elsewhere)

- **Entity-content i18n** — translating user-edited `Name`/`Description`/`Units` per locale. Schema changes, EF Core comparers, JSON search, unique-constraint policy. See `.claude/plans/logistics-content-i18n.md`.
- **Sub-iframe locale propagation** — top-level plugins may later embed operation monitors / profile editors. Their locale comes from the parent via `INIT { data: { locale } }` + `Locale` postMessage, per `docs/specs/plugin-iframe-messaging-spec.md`. Not relevant to standalone Application plugins.

---

## 17. History

- **2026-05-20 (later):** Plugin metadata + ABOUT/CHANGES localized. `PluginAttribute` gains `NameKey` / `DescriptionKey`; `PluginResource.ReadLocalized` resolves `ABOUT.<lng>.md` / `CHANGES.<lng>.md` per request culture; Hub gains `plugins` namespace + `ABOUT.ru.md` + `CHANGES.ru.md` per plugin.
- **2026-05-20:** Backend error-code pipeline complete. `AddLocalization` + `UseRequestLocalization` wired; `EdmException(code, params, fallback)` ctor; `GlobalExceptionHandler` emits `code`/`params`; ~97 throw sites migrated solution-wide; Tech / Board / cross-cutting `Edm.*` catalogs added; Logistics + Tech frontends gain `resolveError` helper.
- **2026-05-20:** Phase 3 sweep complete. All 10 Logistics feature folders converted. `tareSummary()` wired through 4 callers. ES-ES dropped from Phase 1.
- **2026-05 (mid-month):** edm-components i18n primitives (Phase 2.5) — 8 `edm-<group>` namespaces, `registerEdmComponentsLocales` entry point, peer deps on `i18next` / `react-i18next`.
- **2026-05 (early):** Phase 1 plumbing landed — i18next + LanguageDetector + axios `Accept-Language` interceptor. Logistics established as the reference standalone Application plugin (no iframe coupling).
