import axios from 'axios'

axios.defaults.withCredentials = true

export interface PluginSummary {
    guid: string
    name: string
    description: string
    /** i18next key for the localized name. Optional — falls back to {@link name}. */
    nameKey?: string
    /** i18next key for the localized description. Optional — falls back to {@link description}. */
    descriptionKey?: string
    homepage: string
}

export interface UserInfo {
    name: string
    role: string
    roles: string[]
    divisions: string[]
}

export async function fetchPlugins(): Promise<PluginSummary[]> {
    const r = await axios.get<PluginSummary[]>('/api/hub/plugins')
    return r.data
}

export async function fetchUser(): Promise<UserInfo> {
    const r = await axios.get<UserInfo>('/api/auth/user/name')
    return r.data
}

export async function fetchHubAbout(): Promise<string> {
    const r = await axios.get<string>('/api/hub/meta/about', { responseType: 'text' })
    return r.data
}

export async function fetchPluginAbout(guid: string): Promise<string> {
    const r = await axios.get<string>(`/api/hub/meta/about/${guid}`, { responseType: 'text' })
    return r.data
}

// Strips a Windows DOMAIN\ prefix or an email @suffix. Anything else is left alone.
export function cleanName(name: string): string {
    if (!name) return ''
    const slash = name.lastIndexOf('\\')
    if (slash >= 0) return name.slice(slash + 1)
    const at = name.indexOf('@')
    if (at > 0) return name.slice(0, at)
    return name
}

const palette = ['#1F4DE5', '#C2410C', '#047857', '#6D28D9', '#B45309', '#0F766E']

export function pluginColor(guid: string): string {
    const n = Number.parseInt(guid.replace(/-/g, '').slice(0, 8), 16)
    return palette[n % palette.length]
}

export function pluginGlyph(name: string): string {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
}
