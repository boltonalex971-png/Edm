import { Box, Chip, Stack, Tooltip, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import {
    cleanName,
    fetchPlugins,
    fetchUser,
    fetchVersion,
    type PluginSummary,
    type UserInfo,
} from './api'
import { Hero } from './components/Hero'
import { PluginGrid } from './components/PluginGrid'
import './app.css'

const EMPTY_USER: UserInfo = { name: '', role: '', roles: [], divisions: [] }

export default function App() {
    const [plugins, setPlugins] = useState<PluginSummary[]>([])
    const [user, setUser] = useState<UserInfo>(EMPTY_USER)
    const [productVersion, setProductVersion] = useState<string>('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false
        Promise.all([fetchPlugins(), fetchUser(), fetchVersion()])
            .then(([pl, u, v]) => {
                if (cancelled) return
                setPlugins(pl)
                setUser(u)
                setProductVersion(v.product)
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

    const displayName = cleanName(user.name)
    const currentYear = new Date().getFullYear()

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
                    <Box className="header-user" sx={{ ml: 'auto' }}>
                        <Tooltip title={user.name} arrow placement="bottom-end">
                            <span className="user-name">{displayName}</span>
                        </Tooltip>
                        {user.role && <span className="user-role">{user.role}</span>}
                    </Box>
                )}
            </Box>

            <Box component="main" className="page-main">
                <Hero userName={displayName} />
                <PluginGrid plugins={plugins} loading={loading} error={error} />
            </Box>

            <Box component="footer" className="page-footer">
                <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ width: '100%' }}
                >
                    <Typography
                        variant="caption"
                        sx={{ color: 'var(--ink-3)', fontWeight: 500 }}
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
