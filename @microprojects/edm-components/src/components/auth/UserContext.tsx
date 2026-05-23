import {createContext, type ReactNode, useContext} from 'react';

export interface UserContextValue {
    name?: string;
    role?: string;
    roles?: string[];
    divisions?: string[];
}

export const UserContext = createContext<UserContextValue | undefined>(undefined);

export interface UserProviderProps {
    value: UserContextValue | undefined;
    children: ReactNode;
}

export function UserProvider({value, children}: UserProviderProps) {
    return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

/** Returns the current user from context, or `undefined` if no provider. */
export function useOptionalUser(): UserContextValue | undefined {
    return useContext(UserContext);
}
