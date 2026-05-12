import { Box, Typography } from '@mui/material'
import { useEffect, useState } from 'react'

const ROLE_LABEL: Record<string, string> = {
    Admin: 'Administrator',
    Technologist: 'Technologist',
    Operator: 'Operator',
}

export function useClock(): string {
    const [now, setNow] = useState(() => new Date())
    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 30000)
        return () => clearInterval(t)
    }, [])
    return now.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

interface HeroProps {
    /** Short user name (e.g. `m.kovac`); pass `displayUserName(state.user.name)`. */
    userName: string
    /** Full user identity (DOMAIN\name or UPN) for the tooltip. */
    userFull?: string
    /** Active role string from `state.user.role`. Used for the meta line. */
    role?: string
    /** Lead paragraph under the title. Tailor per page. */
    lead: React.ReactNode
    /** Optional preformatted clock string. Pass `useClock()` from caller so the
     *  hook stays at the page level; omit to skip the clock line entirely. */
    clock?: string
}

export const Hero = ({ userName, userFull, role, lead, clock }: HeroProps) => {
    const roleLabel = role ? ROLE_LABEL[role] || role : undefined
    return (
        <Box
            component="header"
            sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'minmax(0, 1fr) auto' },
                alignItems: 'end',
                gap: { xs: 2, sm: 4 },
                borderBottom: '1px solid var(--line)',
                pb: 3,
                mb: 4.5,
            }}
        >
            <Box sx={{ minWidth: 0 }}>
                <Box
                    sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 1.25,
                        mb: 1.25,
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: 'var(--accent)',
                        '&::after': {
                            content: '""',
                            height: '1px',
                            width: 60,
                            background: 'var(--accent)',
                            opacity: 0.35,
                        },
                    }}
                >
                    Welcome
                </Box>
                <Typography
                    component="h1"
                    title={userFull || undefined}
                    sx={{
                        fontSize: { xs: 28, md: 36 },
                        fontWeight: 800,
                        letterSpacing: '-0.018em',
                        color: 'var(--ink-1)',
                        m: 0,
                        mb: 1.25,
                        lineHeight: 1.05,
                    }}
                >
                    {userName ? `Hello, ${userName}` : 'Welcome to EDM Logistics'}
                </Typography>
                <Typography
                    component="p"
                    sx={{
                        fontSize: 15,
                        lineHeight: 1.55,
                        color: 'var(--ink-3)',
                        maxWidth: '56ch',
                        m: 0,
                    }}
                >
                    {lead}
                </Typography>
            </Box>
            {(roleLabel || clock) && (
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0.5,
                        alignItems: { xs: 'flex-start', sm: 'flex-end' },
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: 'var(--ink-4)',
                        textAlign: { xs: 'left', sm: 'right' },
                        whiteSpace: 'nowrap',
                        '& b': { color: 'var(--ink-2)', fontWeight: 700 },
                    }}
                >
                    {roleLabel && (
                        <span>
                            <b>Role</b> · {roleLabel}
                        </span>
                    )}
                    {clock && <span>{clock}</span>}
                </Box>
            )}
        </Box>
    )
}
