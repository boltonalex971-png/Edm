import { Box } from '@mui/material'
import { Changelog } from '@microprojects/edm-components/components/chrome/Changelog'
import { useCallback, useEffect, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import { fetchUser, type UserInfo } from './api'
import { EmbeddedTabs } from './components/EmbeddedTabs'
import { ConsoleLayout } from './components/Layout'
import { type ConsoleSection, Sidebar } from './components/Sidebar'
import { usePluginEmbed } from './lib/usePluginEmbed'
import { DriversPage } from './pages/DriversPage'
import { JobsPage } from './pages/JobsPage'
import { LogPage } from './pages/LogPage'

interface SectionCounts {
    jobs?: number
    drivers?: number
    log?: number
}

function PageBody({
    section,
    onJobsCounts,
    onDriversCount,
}: {
    section: ConsoleSection
    onJobsCounts: (c: { running: number; available: number }) => void
    onDriversCount: (c: number) => void
}) {
    if (section === 'jobs') return <JobsPage onCounts={onJobsCounts} />
    if (section === 'drivers') return <DriversPage onCount={onDriversCount} />
    return <LogPage />
}

export default function App() {
    const { embedded } = usePluginEmbed()
    const [section, setSection] = useState<ConsoleSection>('jobs')
    const [user, setUser] = useState<UserInfo | null>(null)
    const [counts, setCounts] = useState<SectionCounts>({})

    useEffect(() => {
        if (embedded) return
        let cancelled = false
        fetchUser()
            .then((u) => !cancelled && setUser(u))
            .catch(() => {
                /* unauthenticated or endpoint missing — header just hides the user block */
            })
        return () => {
            cancelled = true
        }
    }, [embedded])

    const onJobsCounts = useCallback(
        ({ running }: { running: number; available: number }) => {
            setCounts((c) => ({ ...c, jobs: running }))
        },
        [],
    )
    const onDriversCount = useCallback((n: number) => {
        setCounts((c) => ({ ...c, drivers: n }))
    }, [])

    const body = (
        <PageBody
            section={section}
            onJobsCounts={onJobsCounts}
            onDriversCount={onDriversCount}
        />
    )

    if (embedded) {
        return (
            <Box className="console-embedded">
                <EmbeddedTabs value={section} onChange={setSection} />
                <Box className="embedded-body">{body}</Box>
            </Box>
        )
    }

    const sectionView = (
        <Box className="console-shell">
            <Sidebar value={section} onChange={setSection} counts={counts} />
            <Box className="console-body">{body}</Box>
        </Box>
    )

    return (
        <ConsoleLayout user={user}>
            <Routes>
                <Route
                    path="/changes"
                    element={<Changelog changelogUrl="/api/console/meta/changelog" />}
                />
                <Route path="*" element={sectionView} />
            </Routes>
        </ConsoleLayout>
    )
}
