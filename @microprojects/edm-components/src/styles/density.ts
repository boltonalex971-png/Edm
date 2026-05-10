// HANDOFF · v2 platform.html 04e.6 · density modes are surfaced as a
// `density-{mode}` class on the page root. tokens.css defines the
// `--row-h`/`--btn-h`/`--field-h`/`--section-pad`/`--card-pad` overrides
// for `.density-compact` and `.density-touch`; the default root maps to
// "comfortable". Persistence is per-device under `localStorage.edm.density`.

export type Density = 'compact' | 'comfortable' | 'touch';

const STORAGE_KEY = 'edm.density';
const DEFAULT_DENSITY: Density = 'comfortable';

export function readDensity(): Density {
    try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored === 'compact' || stored === 'comfortable' || stored === 'touch') {
            return stored;
        }
    } catch {
        // localStorage unavailable (private mode, sandbox); fall through to default.
    }
    return DEFAULT_DENSITY;
}

export function writeDensity(value: Density): void {
    try {
        window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
        // Ignore persistence failures; the active class is still applied.
    }
}

export function densityClass(value: Density): string {
    return `density-${value}`;
}
