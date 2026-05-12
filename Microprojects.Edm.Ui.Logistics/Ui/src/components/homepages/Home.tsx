import api from '@logistics/features/api/api'
import { usePost } from '@logistics/hooks/hooks'
import type { Order, OrderStatus } from '@logistics/data/types'
import type { RootState } from '@logistics/store'
import { formatLocalDate, parseUtcDate } from '@logistics/utils/format'
import { displayUserName } from '@microprojects/edm-components/utils'
import {
    ArrowForward as ArrowIcon,
    AutorenewOutlined as RepackingIcon,
    DesktopWindowsOutlined as DesktopIcon,
    Inventory2Outlined as ItemsIcon,
    LocalShippingOutlined as SuppliesIcon,
    PlayCircleOutline as RunningIcon,
    SettingsOutlined as SettingsIcon,
    ListAltOutlined as OrdersIcon,
    WarningAmberOutlined as OverdueIcon,
    HourglassEmptyOutlined as PendingIcon,
} from '@mui/icons-material'
import { Box, Chip, Paper, Typography } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link as RouterLink, useNavigate } from 'react-router-dom'

const ROLE_LABEL: Record<string, string> = {
    Admin: 'Administrator',
    Technologist: 'Technologist',
    Operator: 'Operator',
}

function useClock(): string {
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

const eyebrowSx = {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    color: 'var(--ink-3)',
    lineHeight: 1.2,
}

const sectionTitleSx = {
    ...eyebrowSx,
    fontSize: 12,
    m: 0,
}

const STATUS_LABEL: Record<OrderStatus, string> = {
    Running: 'Running',
    OutputsPending: 'Outputs pending',
    Completed: 'Completed',
    Draft: 'Draft',
}

const STATUS_TONE: Record<OrderStatus, { bg: string; fg: string; border: string }> = {
    Running: {
        bg: 'var(--sig-run-soft)',
        fg: 'var(--sig-run-deep)',
        border: 'var(--sig-run-deep)',
    },
    OutputsPending: {
        bg: 'var(--sig-warn-soft)',
        fg: 'var(--sig-warn-deep)',
        border: 'var(--sig-warn-deep)',
    },
    Completed: {
        bg: 'var(--surface-2)',
        fg: 'var(--ink-3)',
        border: 'var(--line-strong)',
    },
    Draft: {
        bg: 'var(--surface-2)',
        fg: 'var(--ink-2)',
        border: 'var(--line-strong)',
    },
}

const isOverdue = (due: Order['dueDate']) => {
    const d = parseUtcDate(due)
    if (!d) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return d.getTime() <= today.getTime() + 24 * 60 * 60 * 1000
}

export const Home = () => {
    const user = useSelector((s: RootState) => s.user)
    const navigate = useNavigate()

    const [[orders], loading] = usePost<Order[]>(
        `${api.orders}/search`,
        { active: true },
        [],
    )

    const stats = useMemo(() => {
        const list = orders ?? []
        let running = 0
        let pending = 0
        let overdue = 0
        let mineRunning = 0
        for (const o of list) {
            if (o.status === 'Running') running++
            if (o.status === 'OutputsPending') pending++
            if (isOverdue(o.dueDate)) overdue++
            if (o.mine && o.status === 'Running') mineRunning++
        }
        return { active: list.length, running, pending, overdue, mineRunning }
    }, [orders])

    const inFlight = useMemo(() => {
        const list = (orders ?? []).filter(
            (o) => o.status === 'Running' || o.status === 'OutputsPending',
        )
        list.sort((a, b) => {
            const ad = parseUtcDate(a.dueDate)?.getTime() ?? Number.POSITIVE_INFINITY
            const bd = parseUtcDate(b.dueDate)?.getTime() ?? Number.POSITIVE_INFINITY
            return ad - bd
        })
        return list.slice(0, 6)
    }, [orders])

    const isOperatorRole = user.roles?.includes('Operator')
    const userShort = displayUserName(user.name)
    const clock = useClock()

    return (
        <Box
            sx={{
                px: { xs: 2, md: 3 },
                py: { xs: 3, md: 4 },
                maxWidth: 1180,
                mx: 'auto',
                width: '100%',
            }}
        >
            <Hero
                userName={userShort}
                userFull={user.name}
                role={user.role}
                clock={clock}
            />

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                        xs: 'repeat(2, 1fr)',
                        md: 'repeat(4, 1fr)',
                    },
                    gap: 1.5,
                    mt: 2.5,
                }}
            >
                <KpiTile
                    eyebrow="Active orders"
                    value={stats.active}
                    sublabel="open in pipeline"
                    accent="var(--ent-order-deep)"
                    loading={loading}
                    onClick={() => navigate('/orders')}
                />
                <KpiTile
                    eyebrow="Running now"
                    value={stats.running}
                    sublabel={
                        stats.mineRunning > 0
                            ? `${stats.mineRunning} run by you`
                            : 'in execution'
                    }
                    accent="var(--sig-run-deep)"
                    icon={<RunningIcon fontSize="small" />}
                    loading={loading}
                    onClick={() => navigate('/orders')}
                />
                <KpiTile
                    eyebrow="Outputs pending"
                    value={stats.pending}
                    sublabel="awaiting submission"
                    accent="var(--sig-warn-deep)"
                    icon={<PendingIcon fontSize="small" />}
                    loading={loading}
                    onClick={() => navigate('/orders')}
                />
                <KpiTile
                    eyebrow="Overdue"
                    value={stats.overdue}
                    sublabel="past due date"
                    accent="var(--sig-fault-deep)"
                    icon={<OverdueIcon fontSize="small" />}
                    loading={loading}
                    tone={stats.overdue > 0 ? 'fault' : undefined}
                    onClick={() => navigate('/orders')}
                />
            </Box>

            <Box sx={{ mt: 3.5 }}>
                <SectionHeader
                    title="Active work"
                    count={inFlight.length}
                    trailing={
                        <RouterLink
                            to="/orders"
                            style={{
                                fontSize: 12,
                                color: 'var(--accent)',
                                textDecoration: 'none',
                                fontWeight: 600,
                            }}
                        >
                            All orders →
                        </RouterLink>
                    }
                />
                <Paper
                    elevation={0}
                    sx={{
                        background: 'var(--surface)',
                        border: '1px solid var(--line)',
                        borderRadius: 'var(--r-2)',
                        boxShadow: 'var(--elev-1)',
                        overflow: 'hidden',
                    }}
                >
                    {loading && inFlight.length === 0 && (
                        <EmptyRow text="Loading…" />
                    )}
                    {!loading && inFlight.length === 0 && (
                        <EmptyRow text="No orders are currently being executed." />
                    )}
                    {inFlight.map((o, i) => (
                        <ActiveRow
                            key={o.id}
                            order={o}
                            divider={i < inFlight.length - 1}
                            onOpen={() => navigate('/orders')}
                        />
                    ))}
                </Paper>
            </Box>

            <Box sx={{ mt: 3.5 }}>
                <SectionHeader title="Quick actions" />
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                            xs: '1fr',
                            sm: 'repeat(2, 1fr)',
                            md: 'repeat(3, 1fr)',
                            lg: 'repeat(5, 1fr)',
                        },
                        gap: 1.5,
                    }}
                >
                    <ActionTile
                        title="Manage orders"
                        sub="Create, launch, monitor"
                        icon={<OrdersIcon />}
                        accentSoft="var(--ent-order-soft)"
                        accentDeep="var(--ent-order-deep)"
                        onClick={() => navigate('/orders')}
                    />
                    <ActionTile
                        title="Browse items"
                        sub="History & genealogy"
                        icon={<ItemsIcon />}
                        accentSoft="var(--ent-item-soft)"
                        accentDeep="var(--ent-item-deep)"
                        onClick={() => navigate('/items')}
                    />
                    <ActionTile
                        title="Receive supplies"
                        sub="Inbound shipments"
                        icon={<SuppliesIcon />}
                        accentSoft="var(--ent-supply-soft)"
                        accentDeep="var(--ent-supply-deep)"
                        onClick={() => navigate('/supplies')}
                    />
                    <ActionTile
                        title="Repack items"
                        sub="Move between tares"
                        icon={<RepackingIcon />}
                        accentSoft="var(--ent-tare-soft)"
                        accentDeep="var(--ent-tare-deep)"
                        onClick={() => navigate('/repacking')}
                    />
                    <ActionTile
                        title="Configuration"
                        sub="Folders, processes, types"
                        icon={<SettingsIcon />}
                        accentSoft="var(--ent-process-soft)"
                        accentDeep="var(--ent-process-deep)"
                        onClick={() => navigate('/config')}
                    />
                </Box>
            </Box>
        </Box>
    )
}

interface HeroProps {
    userName: string
    userFull: string
    role: string
    clock: string
}

function Hero({ userName, userFull, role, clock }: HeroProps) {
    const roleLabel = ROLE_LABEL[role] || role
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
                    Inventory and shop-floor tracking for production orders,
                    supplies and tare. Pick where you want to start.
                </Typography>
            </Box>
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
                {role && (
                    <span>
                        <b>Role</b> · {roleLabel}
                    </span>
                )}
                <span>{clock}</span>
            </Box>
        </Box>
    )
}

interface KpiTileProps {
    eyebrow: string
    value: number
    sublabel: string
    accent: string
    icon?: React.ReactNode
    loading?: boolean
    tone?: 'fault'
    onClick?: () => void
}

function KpiTile({
    eyebrow,
    value,
    sublabel,
    accent,
    icon,
    loading,
    tone,
    onClick,
}: KpiTileProps) {
    const valueColor = tone === 'fault' ? 'var(--sig-fault-deep)' : 'var(--ink-1)'
    return (
        <Paper
            elevation={0}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={(e) => {
                if (onClick && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault()
                    onClick()
                }
            }}
            sx={{
                position: 'relative',
                p: 2,
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                borderLeft: `3px solid ${accent}`,
                borderRadius: 'var(--r-2)',
                boxShadow: 'var(--elev-1)',
                cursor: onClick ? 'pointer' : 'default',
                transition: 'all 120ms ease',
                '&:hover': onClick
                    ? {
                          borderColor: accent,
                          borderLeftColor: accent,
                          boxShadow: 'var(--elev-2)',
                          transform: 'translateY(-1px)',
                      }
                    : undefined,
                '&:focus-visible': {
                    outline: '2px solid var(--accent)',
                    outlineOffset: 2,
                },
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                    color: 'var(--ink-3)',
                }}
            >
                {icon && (
                    <Box sx={{ color: accent, display: 'flex' }}>{icon}</Box>
                )}
                <Typography sx={eyebrowSx}>{eyebrow}</Typography>
            </Box>
            <Typography
                className="num"
                sx={{
                    mt: 1,
                    fontSize: 36,
                    fontWeight: 700,
                    lineHeight: 1,
                    color: valueColor,
                    letterSpacing: '-0.02em',
                }}
            >
                {loading ? '—' : value}
            </Typography>
            <Typography
                sx={{
                    mt: 0.75,
                    fontSize: 12,
                    color: 'var(--ink-3)',
                }}
            >
                {sublabel}
            </Typography>
        </Paper>
    )
}

interface SectionHeaderProps {
    title: string
    count?: number
    trailing?: React.ReactNode
}

function SectionHeader({ title, count, trailing }: SectionHeaderProps) {
    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 1.25,
                mb: 1.25,
            }}
        >
            <Typography component="h2" sx={sectionTitleSx}>
                {title}
            </Typography>
            {count !== undefined && (
                <Box
                    sx={{
                        flex: '0 0 auto',
                        minWidth: 24,
                        px: 0.75,
                        py: 0.125,
                        borderRadius: 999,
                        background: 'var(--surface-2)',
                        border: '1px solid var(--line-strong)',
                        color: 'var(--ink-2)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        fontWeight: 700,
                        textAlign: 'center',
                    }}
                >
                    {count}
                </Box>
            )}
            <Box
                sx={{
                    flex: 1,
                    height: 1,
                    background: 'var(--line)',
                    alignSelf: 'center',
                }}
            />
            {trailing}
        </Box>
    )
}

interface ActiveRowProps {
    order: Order
    divider: boolean
    onOpen: () => void
}

function ActiveRow({ order, divider, onOpen }: ActiveRowProps) {
    const tone = order.status ? STATUS_TONE[order.status] : STATUS_TONE.Draft
    const overdue = isOverdue(order.dueDate)
    return (
        <Box
            onClick={onOpen}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onOpen()
                }
            }}
            sx={{
                display: 'grid',
                gridTemplateColumns:
                    'auto minmax(80px, 110px) minmax(0, 1.4fr) minmax(0, 1fr) minmax(120px, auto) auto',
                alignItems: 'center',
                gap: 1.5,
                px: 1.75,
                py: 1.25,
                borderBottom: divider ? '1px solid var(--line-soft)' : 'none',
                cursor: 'pointer',
                transition: 'background 120ms ease',
                '&:hover': { background: 'var(--surface-2)' },
                '&:focus-visible': {
                    outline: '2px solid var(--accent)',
                    outlineOffset: -2,
                },
            }}
        >
            <Box
                sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: tone.border,
                    flexShrink: 0,
                }}
            />
            <Typography
                sx={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--ink-1)',
                    letterSpacing: '0.02em',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                }}
            >
                {order.number ? `#${order.number}` : '—'}
            </Typography>
            <Box sx={{ minWidth: 0 }}>
                <Typography
                    sx={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: 'var(--ink-1)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {order.processName || '—'}
                </Typography>
                {order.processNomenclatureName && (
                    <Typography
                        sx={{
                            fontSize: 12,
                            color: 'var(--ink-3)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {order.processNomenclatureName}
                    </Typography>
                )}
            </Box>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                    minWidth: 0,
                }}
            >
                <Chip
                    size="small"
                    label={
                        order.status
                            ? STATUS_LABEL[order.status]
                            : STATUS_LABEL.Draft
                    }
                    sx={{
                        height: 22,
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        background: tone.bg,
                        color: tone.fg,
                        border: `1px solid ${tone.border}`,
                    }}
                />
                {order.executor && (
                    <Typography
                        sx={{
                            fontSize: 12,
                            color: order.mine
                                ? 'var(--sig-run-deep)'
                                : 'var(--ink-3)',
                            fontWeight: order.mine ? 700 : 400,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {order.mine ? 'You' : order.executor}
                    </Typography>
                )}
            </Box>
            <Typography
                sx={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    color: overdue ? 'var(--sig-fault-deep)' : 'var(--ink-3)',
                    fontWeight: overdue ? 700 : 500,
                    textAlign: 'right',
                }}
            >
                {order.dueDate ? formatLocalDate(order.dueDate) : '—'}
            </Typography>
            <ArrowIcon
                fontSize="small"
                sx={{ color: 'var(--ink-4)', justifySelf: 'end' }}
            />
        </Box>
    )
}

function EmptyRow({ text }: { text: string }) {
    return (
        <Box
            sx={{
                py: 3,
                textAlign: 'center',
                color: 'var(--ink-3)',
                fontStyle: 'italic',
                fontSize: 13,
            }}
        >
            {text}
        </Box>
    )
}

interface ActionTileProps {
    title: string
    sub: string
    icon: React.ReactNode
    accentSoft: string
    accentDeep: string
    onClick: () => void
}

function ActionTile({
    title,
    sub,
    icon,
    accentSoft,
    accentDeep,
    onClick,
}: ActionTileProps) {
    return (
        <Paper
            elevation={0}
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onClick()
                }
            }}
            sx={{
                p: 1.75,
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                borderRadius: 'var(--r-2)',
                boxShadow: 'var(--elev-1)',
                cursor: 'pointer',
                transition: 'all 120ms ease',
                '&:hover': {
                    borderColor: accentDeep,
                    boxShadow: 'var(--elev-2)',
                    transform: 'translateY(-1px)',
                },
                '&:focus-visible': {
                    outline: '2px solid var(--accent)',
                    outlineOffset: 2,
                },
            }}
        >
            <Box
                sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 'var(--r-2)',
                    background: accentSoft,
                    color: accentDeep,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {icon}
            </Box>
            <Typography
                sx={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: 'var(--ink-1)',
                    lineHeight: 1.2,
                }}
            >
                {title}
            </Typography>
            <Typography
                sx={{
                    fontSize: 12,
                    color: 'var(--ink-3)',
                    lineHeight: 1.3,
                }}
            >
                {sub}
            </Typography>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    mt: 0.25,
                    color: accentDeep,
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                }}
            >
                Open
                <ArrowIcon sx={{ fontSize: 14 }} />
            </Box>
        </Paper>
    )
}
