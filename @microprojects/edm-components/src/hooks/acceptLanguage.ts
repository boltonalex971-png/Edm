// Plugins register a getter once at app bootstrap so useFetch / query can
// stamp Accept-Language on every request without each call site passing
// the current locale through. The getter is invoked at fetch time, so
// language changes take effect on the next request.
//
// Logistics: index.tsx → setDefaultAcceptLanguage(() => i18n.language).
// Tech: App.tsx → setDefaultAcceptLanguage(() => i18n.language).
//
// When unset, no Accept-Language header is emitted — the backend falls
// back to its default culture, preserving the package's pre-B1 behavior.

let acceptLanguageGetter: (() => string | undefined) | null = null;

export function setDefaultAcceptLanguage(getter: () => string | undefined): void {
    acceptLanguageGetter = getter;
}

export function getAcceptLanguage(): string | undefined {
    return acceptLanguageGetter?.();
}
