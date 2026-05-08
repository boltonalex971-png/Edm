import { Tab, Tabs } from '@mui/material'
import type { ConsoleSection } from './Sidebar'

interface EmbeddedTabsProps {
    value: ConsoleSection
    onChange: (next: ConsoleSection) => void
}

// Embedded mode (loaded inside Technologies' HostConsole iframe) trades the
// sidebar for a horizontal tab strip — the iframe is height-bound so the
// vertical real estate matters more than nav-rail polish.
export function EmbeddedTabs({ value, onChange }: EmbeddedTabsProps) {
    return (
        <Tabs
            value={value}
            onChange={(_, next: ConsoleSection) => onChange(next)}
            className="embedded-tabs"
            indicatorColor="primary"
            textColor="primary"
        >
            <Tab value="jobs" label="Jobs" />
            <Tab value="drivers" label="Drivers" />
            <Tab value="log" label="Log" />
        </Tabs>
    )
}
