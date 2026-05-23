import {createContext} from 'react';

export interface ParentContextValue {
    /** No-arg form is used by package primitives (e.g. LinkTextCell) to trigger
     * a parent reload; the optional `item` is used by plugin-side cells that
     * want to push the freshly-saved row back into the parent grid without a
     * round-trip. Optional to keep both shapes wire-compatible. */
    itemUpdate: (item?: any) => void;
}

export const ParentContext = createContext<ParentContextValue>({itemUpdate: () => {}});
