import React, {createContext, useCallback, useContext, useMemo, useState} from 'react';
import {Density, readDensity, writeDensity, densityClass} from './density';
import {Scheme, readScheme, writeScheme} from './scheme';

// HANDOFF · v2 platform.html 04e.6 · UI preferences (density, scheme).
// Both are stored per-device in localStorage; this provider holds the
// active values in React state so flipping them in the profile menu
// updates the page-root chrome immediately, no reload.

interface UiPreferences {
    density: Density;
    scheme: Scheme;
    setDensity: (d: Density) => void;
    setScheme: (s: Scheme) => void;
}

interface UiPreferencesProviderProps {
    children: React.ReactNode;
    /** Override storage backend (e.g. sessionStorage; null disables persistence). Default: localStorage. */
    storage?: Storage | null;
    /** Prefix for storage keys. Default: 'edm.'. Use to scope per-plugin (e.g. 'logistics.'). */
    storageKeyPrefix?: string;
}

const UiPreferencesContext = createContext<UiPreferences | null>(null);

export function UiPreferencesProvider({children, storage, storageKeyPrefix}: UiPreferencesProviderProps) {
    const [density, setDensityState] = useState<Density>(() => readDensity(storage, storageKeyPrefix));
    const [scheme, setSchemeState] = useState<Scheme>(() => readScheme(storage, storageKeyPrefix));

    const setDensity = useCallback((d: Density) => {
        writeDensity(d, storage, storageKeyPrefix);
        setDensityState(d);
    }, [storage, storageKeyPrefix]);

    const setScheme = useCallback((s: Scheme) => {
        writeScheme(s, storage, storageKeyPrefix);
        setSchemeState(s);
    }, [storage, storageKeyPrefix]);

    const value = useMemo<UiPreferences>(
        () => ({density, scheme, setDensity, setScheme}),
        [density, scheme, setDensity, setScheme]
    );

    return (
        <UiPreferencesContext.Provider value={value}>
            {children}
        </UiPreferencesContext.Provider>
    );
}

export function useUiPreferences(): UiPreferences {
    const ctx = useContext(UiPreferencesContext);
    if (!ctx) {
        /* Outside the provider — fall back to read-only stored values
           with no-op setters. Keeps tests and isolated mounts safe. */
        return {
            density: readDensity(),
            scheme: readScheme(),
            setDensity: () => {},
            setScheme: () => {},
        };
    }
    return ctx;
}

export {densityClass};
