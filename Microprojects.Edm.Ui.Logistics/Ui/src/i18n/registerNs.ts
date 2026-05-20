import i18n from './i18n'

/**
 * Register a per-feature-folder namespace at module load. Call once from
 * the folder's index.ts with a flat `{ <lng>: <dict> }` map of statically-
 * imported JSONs:
 *
 * ```ts
 * import en from './orders.locales/en.json'
 * import ru from './orders.locales/ru.json'
 * registerNs('orders', { en, ru })
 * ```
 *
 * Static imports are mandatory because rsbuild/rspack does not implement
 * Vite's `import.meta.glob` — the call falls through to runtime where
 * `import.meta` is `{}` and `.glob` is undefined. Use this shape on all
 * Logistics feature folders.
 *
 * Idempotent — re-registering the same (lng, ns) pair is a no-op.
 */
export function registerNs(
    ns: string,
    bundles: Record<string, Record<string, unknown>>,
): void {
    for (const [lng, dict] of Object.entries(bundles)) {
        if (i18n.hasResourceBundle(lng, ns)) continue
        i18n.addResourceBundle(lng, ns, dict, true, false)
    }
}
