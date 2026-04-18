import { jwtDecode } from 'jwt-decode'
import type { UserState } from './userSlice'

export function getCookie(name: string) {
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop()?.split(';').shift()
}

export function getUserFromToken(): UserState | null {
    const token = getCookie('X-Auth-Token')
    if (!token) return null

    try {
        const decoded: any = jwtDecode(token)
        const roles = Array.isArray(decoded.Roles)
            ? decoded.Roles
            : decoded.Roles
              ? [decoded.Roles]
              : []
        const divisions = Array.isArray(decoded.Divisions)
            ? decoded.Divisions
            : decoded.Divisions
              ? [decoded.Divisions]
              : []

        const name = decoded.sub || decoded.unique_name || decoded.name
        const role = decoded.role || roles[0]

        return {
            name,
            role,
            roles,
            divisions,
            groups: role === 'Admin' ? [] : divisions, // Based on UserInfo.cs logic
        }
    } catch (e) {
        console.error('Failed to decode token', e)
        return null
    }
}
