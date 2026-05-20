import i18n from './i18n'

/**
 * Server error envelope (ProblemDetails + EDM extensions). `code` and `params`
 * arrive when the backend threw an `EdmException(code, params, fallback)`.
 */
export type EdmProblemDetails = {
    type?: string
    title?: string
    detail?: string
    status?: number
    code?: string
    params?: Record<string, unknown>
}

type AxiosLikeError = {
    response?: { data?: EdmProblemDetails }
    message?: string
}

/**
 * Resolves an axios/fetch error into a user-visible message. Priority:
 *   1. `code` + `params` from server, IF the active i18n bundle has the key
 *   2. Server-resolved `detail` (English text from `GetMeaningfulMessage`)
 *   3. The plain `err.message` (network/JS error)
 *   4. `fallback` (caller's translated default)
 *
 * Wire to existing setError / toast.error sites with `resolveError(err, t('myFallback'))`.
 */
export function resolveError(err: unknown, fallback: string): string {
    const e = err as AxiosLikeError | undefined
    const data = e?.response?.data
    if (data?.code) {
        // Catalog lives under the `errors` namespace as a nested tree keyed by
        // the dot-separated server code (e.g. `Logistics.Tare.NotFound`).
        const key = `errors:${data.code}`
        if (i18n.exists(key)) {
            return i18n.t(key, data.params ?? {}) as string
        }
    }
    return data?.detail || e?.message || fallback
}
