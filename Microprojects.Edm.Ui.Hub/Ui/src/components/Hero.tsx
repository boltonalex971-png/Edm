import { Box, Container, Typography } from '@mui/material'

interface HeroProps {
    userName: string
}

export function Hero({ userName }: HeroProps) {
    return (
        <Container
            maxWidth="lg"
            sx={{ py: { xs: 7, md: 10 }, px: { xs: 4, md: 7 } }}
        >
            <Typography
                component="p"
                className="greeting"
                sx={{ mb: 2 }}
            >
                Welcome{userName ? `, ${userName}` : ''}.
            </Typography>

            <Typography
                variant="h1"
                component="h1"
                sx={{
                    fontSize: { xs: 44, md: 64 },
                    color: 'var(--ink-1)',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.05,
                    fontWeight: 700,
                    mb: 4,
                }}
            >
                Enterprise Data Management.
            </Typography>

            <Typography component="p" className="promo">
                The Enterprise Data Management platform unifies nomenclature
                design, manufacturing routings, supply chains, item traceability
                and live shop-floor operations in a single industrial UI.
            </Typography>

            <Typography component="p" className="promo">
                It covers the full path from a technologist authoring a process
                tree, to a master dispatching work to a cell, to an operator
                executing a job at a kiosk — with batch genealogy, tare and
                inventory management, real-time monitoring and role-aware
                density rules along the way.
            </Typography>

            <Typography component="p" className="promo">
                Each module on this page runs as an independent plugin under one
                shell, sharing identity, theming and conventions so the
                experience stays coherent from the engineer&apos;s desk to the
                operator&apos;s workstation. Pick a module below to enter.
            </Typography>
        </Container>
    )
}
