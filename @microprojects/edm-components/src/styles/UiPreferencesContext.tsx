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

const UiPreferencesContext = createContext<UiPreferences | null>(null);

export function UiPreferencesProvider({children}: {children: React.ReactNode}) {
    const [density, setDensityState] = useState<Density>(() => readDensity());
    const [scheme, setSchemeState] = useState<Scheme>(() => readScheme());

    const setDensity = useCallback((d: Density) => {
        writeDensity(d);
        setDensityState(d);
    }, []);

    const setScheme = useCallback((s: Scheme) => {
        writeScheme(s);
        setSchemeState(s);
    }, []);

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
