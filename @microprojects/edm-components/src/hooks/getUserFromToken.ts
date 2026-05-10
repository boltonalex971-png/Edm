import {jwtDecode} from 'jwt-decode';
import {getCookie} from './getCookie';

export interface DecodedUser {
    name: string | undefined;
    role: string | undefined;
    roles: string[];
    divisions: string[];
}

export function getUserFromToken(): DecodedUser | null {
    const token = getCookie('X-Auth-Token');
    if (!token) return null;

    try {
        const decoded = jwtDecode<any>(token);
        const roles = Array.isArray(decoded.Roles)
            ? decoded.Roles
            : decoded.Roles
                ? [decoded.Roles]
                : [];
        const divisions = Array.isArray(decoded.Divisions)
            ? decoded.Divisions
            : decoded.Divisions
                ? [decoded.Divisions]
                : [];

        return {
            name: decoded.sub || decoded.unique_name || decoded.name,
            role: decoded.role || roles[0],
            roles,
            divisions,
        };
    } catch (e) {
        console.error('Failed to decode token', e);
        return null;
    }
}
