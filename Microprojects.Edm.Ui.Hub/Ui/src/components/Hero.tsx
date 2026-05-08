import { Box, Container, Typography } from '@mui/material'

interface HeroProps {
    pluginCount: number
    productVersion: string
}

export function Hero({ pluginCount, productVersion }: HeroProps) {
    return (
        <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 }, px: { xs: 4, md: 7 } }}>
            <Box className="stamp">
                <b>Doc · ASM-EDM-{productVersion || '0.0.0'}</b>
                <span className="sep">/</span>
                <span>Status: Live</span>
                <span className="sep">/</span>
                <span>Owner · Platform UX</span>
                <span className="sep">/</span>
                <span>Industry · Discrete Manufacturing</span>
            </Box>

            <Box className="hero-grid">
                <Box>
                    <Typography
                        variant="h1"
                        component="h1"
                        sx={{
                            fontSize: { xs: 56, md: 88 },
                            color: 'var(--ink-1)',
                            mb: 0,
                        }}
                    >
                        Industrial UI<br />
                        for the <em className="hero-em">plugin&#8209;based</em><br />
                        EDM platform.
                    </Typography>
                    <Typography
                        sx={{
                            fontSize: 18,
                            color: 'var(--ink-3)',
                            lineHeight: 1.55,
                            maxWidth: '52ch',
                            mt: 4,
                        }}
                    >
                        EDM is a host shell composed of independent plugins — each named{' '}
                        <code>EDM&nbsp;{'{Plugin}'}</code>. Pick a module below to enter; every
                        plugin shares the same chrome, tokens and role-aware UI rules so the
                        platform reads as one product on the shop floor and at the
                        technologist&apos;s desk.
                    </Typography>
                </Box>

                <aside className="blueprint">
                    <div className="ble-h">System summary</div>
                    <div className="stat-row">
                        <div className="stat">
                            <div className="v">{pluginCount}</div>
                            <div className="l">Application plugins</div>
                        </div>
                        <div className="stat">
                            <div className="v">{productVersion || '—'}</div>
                            <div className="l">Product version</div>
                        </div>
                        <div className="stat">
                            <div className="v">3</div>
                            <div className="l">Density modes</div>
                        </div>
                        <div className="stat">
                            <div className="v">4</div>
                            <div className="l">Role playbooks</div>
                        </div>
                    </div>
                </aside>
            </Box>
        </Container>
    )
}
