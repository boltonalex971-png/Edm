import { Box, Container } from '@mui/material'
import { useEffect, useState } from 'react'
import { fetchPlugins, fetchVersion, type PluginSummary } from './api'
import { Hero } from './components/Hero'
import { PluginGrid } from './components/PluginGrid'
import './app.css'

export default function App() {
    const [plugins, setPlugins] = useState<PluginSummary[]>([])
    const [version, setVersion] = useState<string>('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false
        Promise.all([fetchPlugins(), fetchVersion()])
            .then(([pl, ver]) => {
                if (cancelled) return
                setPlugins(pl)
                setVersion(ver.productVersion)
            })
            .catch((e: Error) => {
                if (cancelled) return
                setError(`Failed to load plugins: ${e.message}`)
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => {
            cancelled = true
        }
    }, [])

    return (
        <Box>
            <Box component="header" className="doc-top">
                <a className="doc-brand" href="/">
                    <div className="doc-brand-mark">EDM</div>
                    <div className="doc-brand-text">
                        <span className="row1">EDM Hub</span>
                        <span className="row2">v{version || '—'}</span>
                    </div>
                </a>
                <Box className="doc-top-end" sx={{ ml: 'auto' }}>
                    <span className="pill">Direction A · Steel</span>
                </Box>
            </Box>

            <Hero pluginCount={plugins.length} productVersion={version} />
            <PluginGrid plugins={plugins} loading={loading} error={error} />

            <Container
                component="footer"
                maxWidth="lg"
                className="ix-foot"
                sx={{ px: { xs: 4, md: 7 } }}
            >
                <div>
                    <b>EDM Hub</b> · v{version || '—'} · Owner: Platform UX
                </div>
                <div>Direction A · Steel · Comfortable density</div>
            </Container>
        </Box>
    )
}
