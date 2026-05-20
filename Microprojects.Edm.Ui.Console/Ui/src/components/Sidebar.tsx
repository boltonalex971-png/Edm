import ListAltOutlined from '@mui/icons-material/ListAltOutlined'
import PlayArrowOutlined from '@mui/icons-material/PlayArrowOutlined'
import PowerOutlined from '@mui/icons-material/PowerOutlined'
import { Box } from '@mui/material'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

export type ConsoleSection = 'jobs' | 'drivers' | 'log'

interface SidebarProps {
    value: ConsoleSection
    onChange: (next: ConsoleSection) => void
    counts: Partial<Record<ConsoleSection, number>>
}

interface NavEntry {
    key: ConsoleSection
    labelKey: string
    fallback: string
    icon: ReactNode
}

const NAV: NavEntry[] = [
    { key: 'jobs', labelKey: 'nav.jobs', fallback: 'Jobs', icon: <PlayArrowOutlined fontSize="small" /> },
    { key: 'drivers', labelKey: 'nav.drivers', fallback: 'Drivers', icon: <PowerOutlined fontSize="small" /> },
    { key: 'log', labelKey: 'nav.log', fallback: 'Log', icon: <ListAltOutlined fontSize="small" /> },
]

// 220px master-list rail per handoff CMP-13. Selected row gets the inset 3px
// accent bar + tint background — never a full-color fill.
export function Sidebar({ value, onChange, counts }: SidebarProps) {
    const { t } = useTranslation('console')
    return (
        <Box component="nav" className="console-sidebar" aria-label={t('sidebar.ariaLabel', 'Console sections')}>
            <div className="sidebar-eyebrow">{t('sidebar.eyebrow', 'Operations')}</div>
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
                                <span className="label">{t(item.labelKey, item.fallback)}</span>
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
