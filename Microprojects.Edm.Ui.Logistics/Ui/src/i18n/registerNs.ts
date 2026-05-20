import i18n from './i18n'

type LocaleModule = { default: Record<string, unknown> }

/**
 * Register a per-feature-folder namespace at module load. Call once from the
 * folder's index.ts: `registerNs('orders', import.meta.glob('./orders.locales/*.json', { eager: true }))`.
 * Idempotent — re-registering the same bundle is a no-op.
 */
export function registerNs(
    ns: string,
    resources: Record<string, LocaleModule>,
): void {
    for (const [path, mod] of Object.entries(resources)) {
        const match = path.match(/([\w-]+)\.json$/)
        if (!match) continue
        const lng = match[1]
        if (!i18n.hasResourceBundle(lng, ns)) {
            i18n.addResourceBundle(lng, ns, mod.default, true, false)
        }
    }
}
