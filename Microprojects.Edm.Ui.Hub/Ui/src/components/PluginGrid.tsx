import { Box, Container } from '@mui/material'
import { pluginColor, pluginGlyph, type PluginSummary } from '../api'

interface PluginGridProps {
    plugins: PluginSummary[]
    loading: boolean
    error: string | null
}

export function PluginGrid({ plugins, loading, error }: PluginGridProps) {
    return (
        <Container maxWidth="lg" sx={{ pb: { xs: 8, md: 12 }, px: { xs: 4, md: 7 } }}>
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

            <Box className="plugin-cards">
                {plugins.map((p) => (
                    <a key={p.guid} className="plugin-card" href={`/${p.homepage ?? ''}`}>
                        <div className="lead-row">
                            <div
                                className="glyph"
                                style={{ background: pluginColor(p.guid) }}
                            >
                                {pluginGlyph(p.name)}
                            </div>
                            <div className="name">
                                <span className="edm-prefix">EDM</span>
                                {p.name}
                            </div>
                        </div>
                        <div className="desc">{p.description}</div>
                    </a>
                ))}
                {!loading && plugins.length === 0 && !error && (
                    <Box
                        sx={{
                            gridColumn: '1 / -1',
                            textAlign: 'center',
                            color: 'var(--ink-3)',
                            py: 6,
                            border: '1px dashed var(--line-strong)',
                            borderRadius: '4px',
                            background: 'var(--surface)',
                        }}
                    >
                        No application plugins are loaded.
                    </Box>
                )}
            </Box>
        </Container>
    )
}
