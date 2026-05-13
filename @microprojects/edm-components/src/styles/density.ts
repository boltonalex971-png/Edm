// HANDOFF · v2 platform.html 04e.6 · density modes are surfaced as a
// `density-{mode}` class on the page root. tokens.css now drives density
// through `zoom` on the page root rather than per-token overrides:
// compact = base (zoom 1), comfortable = 1.15, touch = 1.3225 — ~15% per
// step. Because zoom scales the entire rendered subtree, every element on
// the page (text, padding, borders, icons, hard-coded pixel values in
// component CSS) grows together, not just the row/field/button tokens.
// The matching `--density-zoom` CSS variable is published so layout
// containers can pre-divide viewport-relative sizes (see `.page-root`
// `min-height: calc(100vh / var(--density-zoom, 1))`).
// Persistence is per-device under `localStorage.edm.density`.

export type Density = 'compact' | 'comfortable' | 'touch';

const STORAGE_KEY_SUFFIX = 'density';
const DEFAULT_PREFIX = 'edm.';
const DEFAULT_DENSITY: Density = 'comfortable';

function getStorage(custom?: Storage | null): Storage | null {
    if (custom !== undefined) return custom;
    try { return window.localStorage; } catch { return null; }
}

export function readDensity(storage?: Storage | null, keyPrefix: string = DEFAULT_PREFIX): Density {
    const s = getStorage(storage);
    if (!s) return DEFAULT_DENSITY;
    try {
        const stored = s.getItem(`${keyPrefix}${STORAGE_KEY_SUFFIX}`);
        if (stored === 'compact' || stored === 'comfortable' || stored === 'touch') {
            return stored;
        }
    } catch {
        // storage unavailable (private mode, sandbox); fall through to default.
    }
    return DEFAULT_DENSITY;
}

export function writeDensity(value: Density, storage?: Storage | null, keyPrefix: string = DEFAULT_PREFIX): void {
    const s = getStorage(storage);
    if (!s) return;
    try {
        s.setItem(`${keyPrefix}${STORAGE_KEY_SUFFIX}`, value);
    } catch {
        // Ignore persistence failures; the active class is still applied.
    }
}

export function densityClass(value: Density): string {
    return `density-${value}`;
}
