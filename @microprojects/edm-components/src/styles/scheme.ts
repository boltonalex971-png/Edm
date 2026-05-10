// HANDOFF · v2 platform.html 04e.6 · light/dark scheme. Surfaced as the
// `data-scheme="light|dark"` attribute on the page root; tokens.css carries
// the dark overlay under `.theme-shop`. PENDING · the dark overlay is
// keyed off `.theme-shop` upstream and `[data-scheme="dark"]` here — when
// dark ships in Technologies the two need to converge (selector or attr).
// Persistence is per-device under `localStorage.edm.scheme`.

export type Scheme = 'light' | 'dark';

const STORAGE_KEY = 'edm.scheme';
const DEFAULT_SCHEME: Scheme = 'light';

export function readScheme(): Scheme {
    try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored === 'light' || stored === 'dark') {
            return stored;
        }
    } catch {
        // localStorage unavailable (private mode, sandbox); fall through to default.
    }
    return DEFAULT_SCHEME;
}

export function writeScheme(value: Scheme): void {
    try {
        window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
        // Ignore persistence failures; the active attribute is still applied.
    }
}
