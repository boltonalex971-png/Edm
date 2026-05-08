import { Box } from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import { fetchUser, fetchVersion, type UserInfo } from './api'
import { EmbeddedTabs } from './components/EmbeddedTabs'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
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
    const [productVersion, setProductVersion] = useState('')
    const [counts, setCounts] = useState<SectionCounts>({})

    useEffect(() => {
        if (embedded) return
        let cancelled = false
        fetchUser()
            .then((u) => !cancelled && setUser(u))
            .catch(() => {
                /* unauthenticated or endpoint missing — header just hides the user block */
            })
        fetchVersion()
            .then((v) => !cancelled && setProductVersion(v.product))
            .catch(() => {
                /* version chip falls back to em-dash */
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

    return (
        <Box className="page-root" data-plugin="admin">
            <Header user={user} />
            <Box className="console-shell">
                <Sidebar value={section} onChange={setSection} counts={counts} />
                <Box component="main" className="page-main">
                    {body}
                </Box>
            </Box>
            <Footer productVersion={productVersion} />
        </Box>
    )
}
