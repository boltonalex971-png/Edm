import axios from 'axios'

axios.defaults.withCredentials = true

export interface AvailableTask {
    name: string
    description: string
    status: string
    type: string
}

export interface DriverInfo {
    name: string
    description: string
    profileName: string
    guid: string
}

export interface LogEntry {
    message: string
    source: string
    timeGenerated: string
    entryType: string
}

export interface UserInfo {
    name: string
    role: string
    roles: string[]
    divisions: string[]
}

export interface VersionInfo {
    product: string
}

export async function fetchAvailableTasks(): Promise<AvailableTask[]> {
    const r = await axios.get<AvailableTask[]>('/api/tasks/available')
    return r.data ?? []
}

export async function fetchRunningTasks(): Promise<AvailableTask[]> {
    const r = await axios.get<AvailableTask[]>('/api/tasks/running')
    return r.data ?? []
}

export async function fetchDrivers(): Promise<DriverInfo[]> {
    const r = await axios.get<DriverInfo[]>('/api/drivers')
    return r.data ?? []
}

export async function fetchLog(
    startFrom = 0,
    amount = 50,
    level?: string,
): Promise<LogEntry[]> {
    const params: Record<string, string | number> = { startFrom, amount }
    if (level) params.level = level
    const r = await axios.get<LogEntry[]>('/api/log', { params })
    return r.data ?? []
}

export async function fetchLogLevels(): Promise<string[]> {
    const r = await axios.get<string[]>('/api/log/levels')
    return r.data ?? []
}

export async function fetchUser(): Promise<UserInfo> {
    const r = await axios.get<UserInfo>('/api/auth/user/name')
    return r.data
}

export async function fetchVersion(): Promise<VersionInfo> {
    const r = await axios.get<VersionInfo>('/api/hub/meta/version')
    return r.data
}

// Strips DOMAIN\ or @suffix from a Windows / email-style name.
export function cleanName(name: string): string {
    if (!name) return ''
    const slash = name.lastIndexOf('\\')
    if (slash >= 0) return name.slice(slash + 1)
    const at = name.indexOf('@')
    if (at > 0) return name.slice(0, at)
    return name
}
