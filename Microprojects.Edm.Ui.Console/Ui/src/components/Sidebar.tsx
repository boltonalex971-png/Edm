import ListAltOutlined from '@mui/icons-material/ListAltOutlined'
import PlayArrowOutlined from '@mui/icons-material/PlayArrowOutlined'
import PowerOutlined from '@mui/icons-material/PowerOutlined'
import { Box } from '@mui/material'
import type { ReactNode } from 'react'

export type ConsoleSection = 'jobs' | 'drivers' | 'log'

interface SidebarProps {
    value: ConsoleSection
    onChange: (next: ConsoleSection) => void
    counts: Partial<Record<ConsoleSection, number>>
}

interface NavEntry {
    key: ConsoleSection
    label: string
    icon: ReactNode
}

const NAV: NavEntry[] = [
    { key: 'jobs', label: 'Jobs', icon: <PlayArrowOutlined fontSize="small" /> },
    { key: 'drivers', label: 'Drivers', icon: <PowerOutlined fontSize="small" /> },
    { key: 'log', label: 'Log', icon: <ListAltOutlined fontSize="small" /> },
]

// 220px master-list rail per handoff CMP-13. Selected row gets the inset 3px
// accent bar + tint background — never a full-color fill.
export function Sidebar({ value, onChange, counts }: SidebarProps) {
    return (
        <Box component="nav" className="console-sidebar" aria-label="Console sections">
            <div className="sidebar-eyebrow">Operations</div>
            <ul className="sidebar-list">
                {NAV.map((item) => {
                    const active = item.key === value
                    const count = counts[item.key]
                    return (
                        <li key={item.key}>
                            <button
                                type="button"
                                className={`sidebar-row${active ? ' active' : ''}`}
                                onClick={() => onChange(item.key)}
                            >
                                <span className="icon">{item.icon}</span>
                                <span className="label">{item.label}</span>
                                {count !== undefined && (
                                    <span className="count">{count}</span>
                                )}
                            </button>
                        </li>
                    )
                })}
            </ul>
        </Box>
    )
}
