// HANDOFF · v2 platform.html 04e.6 · light/dark scheme. Surfaced as the
// `data-scheme="light|dark"` attribute on the page root; tokens.css carries
// the dark overlay under `.theme-shop`. PENDING · the dark overlay is
// keyed off `.theme-shop` upstream and `[data-scheme="dark"]` here — when
// dark ships in Technologies the two need to converge (selector or attr).
// Persistence is per-device under `localStorage.edm.scheme`.

export type Scheme = 'light' | 'dark';

const STORAGE_KEY_SUFFIX = 'scheme';
const DEFAULT_PREFIX = 'edm.';
const DEFAULT_SCHEME: Scheme = 'light';

function getStorage(custom?: Storage | null): Storage | null {
    if (custom !== undefined) return custom;
    try { return window.localStorage; } catch { return null; }
}

export function readScheme(storage?: Storage | null, keyPrefix: string = DEFAULT_PREFIX): Scheme {
    const s = getStorage(storage);
    if (!s) return DEFAULT_SCHEME;
    try {
        const stored = s.getItem(`${keyPrefix}${STORAGE_KEY_SUFFIX}`);
        if (stored === 'light' || stored === 'dark') {
            return stored;
        }
    } catch {
        // storage unavailable (private mode, sandbox); fall through to default.
    }
    return DEFAULT_SCHEME;
}

export function writeScheme(value: Scheme, storage?: Storage | null, keyPrefix: string = DEFAULT_PREFIX): void {
    const s = getStorage(storage);
    if (!s) return;
    try {
        s.setItem(`${keyPrefix}${STORAGE_KEY_SUFFIX}`, value);
    } catch {
        // Ignore persistence failures; the active attribute is still applied.
    }
}
