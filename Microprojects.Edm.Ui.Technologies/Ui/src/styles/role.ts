import { appRoles } from '../ApiContext'

export type SchemeRole = 'admin' | 'tech' | 'op'

// Map the plugin's user role values onto the design system's data-role
// vocabulary. Admin and Technologist both render with the cobalt accent;
// Operator switches to green.
export function roleAttr(userRole: string | undefined | null): SchemeRole {
    if (userRole === appRoles.operator) return 'op'
    if (userRole === appRoles.admin) return 'admin'
    return 'tech'
}
