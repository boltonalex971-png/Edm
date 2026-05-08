import { Box } from '@mui/material'

export type SignalKind = 'run' | 'warn' | 'fault' | 'idle' | 'queued' | 'info'

interface StatusBadgeProps {
    kind: SignalKind
    label: string
}

// Industrial signal pill from the design handoff (CMP-04). Colors come from
// --sig-* tokens; the dot + label combo keeps status legible at a glance.
export function StatusBadge({ kind, label }: StatusBadgeProps) {
    return (
        <Box className={`status-badge status-badge--${kind}`}>
            <span className="dot" aria-hidden />
            <span>{label}</span>
        </Box>
    )
}

// Mapper used by Jobs/Log pages. Keeps the badge component dumb.
export function statusToKind(status: string | undefined): SignalKind {
    const s = (status || '').toLowerCase()
    if (s.includes('run') || s.includes('active') || s === 'ok') return 'run'
    if (s.includes('warn') || s.includes('drift')) return 'warn'
    if (s.includes('error') || s.includes('fault') || s.includes('fail')) return 'fault'
    if (s.includes('queue') || s.includes('schedul')) return 'queued'
    if (s.includes('info') || s.includes('information')) return 'info'
    return 'idle'
}
