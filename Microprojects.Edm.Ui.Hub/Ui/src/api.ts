import axios from 'axios'

axios.defaults.withCredentials = true

export interface PluginSummary {
    guid: string
    name: string
    description: string
    homepage: string
}

export interface VersionInfo {
    productVersion: string
}

export async function fetchPlugins(): Promise<PluginSummary[]> {
    const r = await axios.get<PluginSummary[]>('/api/hub/plugins')
    return r.data
}

export async function fetchVersion(): Promise<VersionInfo> {
    const r = await axios.get<VersionInfo>('/api/hub/plugins/version')
    return r.data
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
