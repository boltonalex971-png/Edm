import {createContext} from 'react';

export interface ParentContextValue {
    itemUpdate: () => void;
}

export const ParentContext = createContext<ParentContextValue>({itemUpdate: () => {}});
