import { Box, Container, Typography } from '@mui/material'
import { pluginColor, pluginGlyph, type PluginSummary } from '../api'

interface PluginGridProps {
    plugins: PluginSummary[]
    loading: boolean
    error: string | null
}

export function PluginGrid({ plugins, loading, error }: PluginGridProps) {
    return (
        <Container maxWidth="lg" sx={{ pb: { xs: 8, md: 12 }, px: { xs: 4, md: 7 } }}>
            <Box className="ix-section-h">
                <div className="step">
                    Section
                    <b>I · Application plugins</b>
                </div>
                <div>
                    <Typography variant="h2" component="h2" sx={{ color: 'var(--ink-1)', m: 0 }}>
                        One shell, many plugins.
                    </Typography>
                    <Typography sx={{ color: 'var(--ink-3)', mt: 1, maxWidth: '60ch' }}>
                        Every plugin is a self-contained module mounted into the EDM shell. Pick
                        one to enter — the active plugin owns the accent stripe and breadcrumb;
                        the shell never does.
                    </Typography>
                </div>
            </Box>

            {error && (
                <Box
                    sx={{
                        border: '1px solid var(--sig-fault)',
                        borderLeft: '3px solid var(--sig-fault)',
                        background: 'var(--sig-fault-soft)',
                        color: 'var(--sig-fault-deep)',
                        p: 2,
                        mb: 3,
                        fontSize: 13,
                    }}
                >
                    {error}
                </Box>
            )}

            <section className="plugins">
                <div className="plugins-h">
                    <span className="label">Plugin registry</span>
                    <h3>Wordmark · accent · description</h3>
                    <span className="right">
                        {loading ? 'loading…' : `${plugins.length} loaded`}
                    </span>
                </div>
                <div className="plugins-grid">
                    {plugins.map((p) => (
                        <a
                            key={p.guid}
                            className="plug"
                            href={`/${p.homepage ?? ''}`}
                        >
                            <div className="lead-row">
                                <div
                                    className="glyph"
                                    style={{ background: pluginColor(p.guid) }}
                                >
                                    {pluginGlyph(p.name)}
                                </div>
                                <div>
                                    <div className="name">
                                        <span className="edm-prefix">EDM</span>
                                        {p.name}
                                    </div>
                                </div>
                            </div>
                            <div className="desc">{p.description}</div>
                            <div className="role-row">
                                <span>/{p.homepage}</span>
                            </div>
                        </a>
                    ))}
                    {!loading && plugins.length === 0 && !error && (
                        <div
                            className="plug"
                            style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--ink-3)' }}
                        >
                            No application plugins are loaded.
                        </div>
                    )}
                </div>
            </section>
        </Container>
    )
}
