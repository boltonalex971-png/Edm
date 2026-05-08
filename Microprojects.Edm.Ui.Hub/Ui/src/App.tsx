import {Box, Chip, Stack, Tooltip, Typography} from '@mui/material'
import {SmartScroll, SmartScrollContent} from '@microprojects/tools'
import {useEffect, useMemo, useState} from 'react'
import {
    cleanName,
    fetchHubAbout,
    fetchPluginAbout,
    fetchPlugins,
    fetchUser,
    fetchVersion,
    type PluginSummary,
    type UserInfo,
} from './api'
import {AboutPanel} from './components/AboutPanel'
import {Greeting} from './components/Greeting'
import {PluginList} from './components/PluginList'
import './app.css'

const EMPTY_USER: UserInfo = {name: '', role: '', roles: [], divisions: []}

// Top of the SmartScroll-stuck region: top of #main, which sits below the 56px header.
const SMART_SCROLL_OFFSET = 64

export default function App() {
    const [plugins, setPlugins] = useState<PluginSummary[]>([])
    const [user, setUser] = useState<UserInfo>(EMPTY_USER)
    const [productVersion, setProductVersion] = useState<string>('')
    const [hubAbout, setHubAbout] = useState<string>('')
    const [aboutCache, setAboutCache] = useState<Record<string, string>>({})
    const [activeGuid, setActiveGuid] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false
        Promise.all([fetchPlugins(), fetchUser(), fetchVersion(), fetchHubAbout()])
            .then(([pl, u, v, hub]) => {
                if (cancelled) return
                setPlugins(pl)
                setUser(u)
                setProductVersion(v.product)
                setHubAbout(hub)
            })
            .catch((e: Error) => {
                if (cancelled) return
                setError(`Failed to load: ${e.message}`)
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => {
            cancelled = true
        }
    }, [])

    // Lazy-fetch a plugin's ABOUT the first time the user hovers/focuses its tile.
    useEffect(() => {
        if (!activeGuid || aboutCache[activeGuid] !== undefined) return
        let cancelled = false
        fetchPluginAbout(activeGuid)
            .then((md) => {
                if (cancelled) return
                setAboutCache((prev) => ({...prev, [activeGuid]: md}))
            })
            .catch(() => {
                // Plugin may not ship an ABOUT.md; treat as empty so we don't keep retrying.
                if (cancelled) return
                setAboutCache((prev) => ({...prev, [activeGuid]: ''}))
            })
        return () => {
            cancelled = true
        }
    }, [activeGuid, aboutCache])

    const displayName = cleanName(user.name)
    const currentYear = new Date().getFullYear()

    const activeAbout = useMemo(() => {
        if (!activeGuid) return hubAbout
        const cached = aboutCache[activeGuid]
        return cached !== undefined && cached !== '' ? cached : hubAbout
    }, [activeGuid, aboutCache, hubAbout])

    return (
        <Box className="page-root">
            <Box component="header" className="doc-top">
                <a className="doc-brand" href="/">
                    <div className="doc-brand-mark">EDM</div>
                    <div className="doc-brand-text">
                        <span className="row1">EDM Hub</span>
                    </div>
                </a>

                {displayName && (
                    <Box className="header-user" sx={{ml: 'auto'}}>
                        <Tooltip title={user.name} arrow placement="bottom-end">
                            <span className="user-name">{displayName}</span>
                        </Tooltip>
                        {user.role && <span className="user-role">{user.role}</span>}
                    </Box>
                )}
            </Box>

            <Box component="main" className="page-main">
                <div className="landing-grid">
                    <div></div>
                    <Greeting userName={displayName}/>
                </div>
                <SmartScroll
                    offsetTop={SMART_SCROLL_OFFSET}
                    className="landing-grid"
                >
                    <SmartScrollContent className="landing-left">
                        <PluginList
                            plugins={plugins}
                            loading={loading}
                            error={error}
                            activeGuid={activeGuid}
                            onActivate={setActiveGuid}
                        />
                    </SmartScrollContent>
                    <SmartScrollContent className="landing-right">
                        <AboutPanel markdown={activeAbout} loading={loading}/>
                    </SmartScrollContent>
                </SmartScroll>
            </Box>

            <Box component="footer" className="page-footer">
                <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{width: '100%'}}
                >
                    <Typography
                        variant="caption"
                        sx={{color: 'var(--ink-3)', fontWeight: 500}}
                    >
                        &copy; Microprojects 2020 &ndash; {currentYear}
                    </Typography>
                    <Chip
                        label={`EDM ${productVersion || '—'}`}
                        size="small"
                        variant="outlined"
                        className="version-chip"
                    />
                </Stack>
            </Box>
        </Box>
    )
}
