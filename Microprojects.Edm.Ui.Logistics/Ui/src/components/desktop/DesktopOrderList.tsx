import api from '@features/api/api.ts'
import type { Order, OrderStatus, UUID } from '@logistics/data/types'
import { usePost } from '@logistics/hooks/hooks'
import { formatLocalDate, parseUtcDate } from '@logistics/utils/format'
import {
    LockOutlined as LockIcon,
    PlayArrowOutlined as PlayIcon,
    OpenInFullOutlined as OpenIcon,
    WarningAmberOutlined as WarnIcon,
} from '@mui/icons-material'
import {
    Alert,
    Box,
    Button as MuiButton,
    Chip,
    Paper,
    Typography,
} from '@mui/material'
import { useMemo } from 'react'

type DesktopOrderListProps = {
    onOpen: (id: UUID, mine: boolean, lockedByOther: boolean) => void
}

const STATUS_LABEL: Record<string, string> = {
    Running: 'Running',
    OutputsPending: 'Outputs pending',
    Completed: 'Completed',
}

const statusLabel = (status?: OrderStatus) =>
    (status && STATUS_LABEL[status]) || 'Draft'

interface Tone {
    bg: string
    fg: string
    border: string
}

const STATUS_TONE: Record<string, Tone> = {
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
}

const DRAFT_TONE: Tone = {
    bg: 'var(--surface-2)',
    fg: 'var(--ink-2)',
    border: 'var(--line-strong)',
}

const FAULT_TONE: Tone = {
    bg: 'var(--sig-fault-soft)',
    fg: 'var(--sig-fault-deep)',
    border: 'var(--sig-fault-deep)',
}

const statusTone = (status?: OrderStatus): Tone =>
    (status && STATUS_TONE[status]) || DRAFT_TONE

const isOverdue = (dueDate: Order['dueDate']) => {
    const due = parseUtcDate(dueDate)
    if (!due) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return due.getTime() <= today.getTime() + 24 * 60 * 60 * 1000
}

type CardVariant = 'mine' | 'available' | 'locked'

const VARIANT_ACCENT: Record<CardVariant, string> = {
    mine: 'var(--sig-run-deep)',
    available: 'var(--accent)',
    locked: 'var(--ink-3)',
}

const sectionTitleSx = {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    color: 'var(--ink-3)',
    m: 0,
}

const monoLabelSx = {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.07em',
    color: 'var(--ink-3)',
    mb: 0.25,
    lineHeight: 1.1,
}

export const DesktopOrderList = ({ onOpen }: DesktopOrderListProps) => {
    const [[orders], loading, error] = usePost<Order[]>(
        `${api.orders}/search`,
        { active: true },
        [],
    )

    const { mine, available } = useMemo(() => {
        const mine: Order[] = []
        const available: Order[] = []
        for (const order of orders ?? []) {
            if (order.mine) mine.push(order)
            else available.push(order)
        }
        mine.sort((a, b) => (a.status ?? '').localeCompare(b.status ?? ''))
        available.sort((a, b) => {
            const ad =
                parseUtcDate(a.dueDate)?.getTime() ??
                Number.POSITIVE_INFINITY
            const bd =
                parseUtcDate(b.dueDate)?.getTime() ??
                Number.POSITIVE_INFINITY
            return ad - bd
        })
        return { mine, available }
    }, [orders])

    return (
        <Box>
            {error && (
                <Alert severity="error" sx={{ mb: 1.5 }}>
                    {typeof error === 'string'
                        ? error
                        : 'Failed to load orders'}
                </Alert>
            )}

            {mine.length > 0 && (
                <SectionHeader title="My pending orders" count={mine.length} />
            )}
            {mine.length > 0 && (
                <CardGrid>
                    {mine.map((o) => (
                        <OrderCard
                            key={o.id}
                            order={o}
                            variant="mine"
                            onOpen={onOpen}
                        />
                    ))}
                </CardGrid>
            )}

            <SectionHeader
                title="Available orders"
                count={available.length}
                topGap={mine.length > 0 ? 'lg' : 'sm'}
            />
            {loading && available.length === 0 && (
                <EmptyMsg text="Loading…" />
            )}
            {!loading && available.length === 0 && (
                <EmptyMsg text="No orders are available to start right now." />
            )}
            {available.length > 0 && (
                <CardGrid>
                    {available.map((o) => (
                        <OrderCard
                            key={o.id}
                            order={o}
                            variant={o.executor ? 'locked' : 'available'}
                            onOpen={onOpen}
                        />
                    ))}
                </CardGrid>
            )}
        </Box>
    )
}

interface SectionHeaderProps {
    title: string
    count: number
    topGap?: 'sm' | 'lg'
}

function SectionHeader({ title, count, topGap = 'sm' }: SectionHeaderProps) {
    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 1.25,
                mt: topGap === 'lg' ? 3 : 0.5,
                mb: 1.25,
            }}
        >
            <Typography component="h2" sx={sectionTitleSx}>
                {title}
            </Typography>
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
            <Box
                sx={{
                    flex: 1,
                    height: 1,
                    background: 'var(--line)',
                    alignSelf: 'center',
                }}
            />
        </Box>
    )
}

function CardGrid({ children }: { children: React.ReactNode }) {
    return (
        <Box
            sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
                gap: 1.5,
            }}
        >
            {children}
        </Box>
    )
}

interface OrderCardProps {
    order: Order
    variant: CardVariant
    onOpen: (id: UUID, mine: boolean, lockedByOther: boolean) => void
}

function OrderCard({ order, variant, onOpen }: OrderCardProps) {
    const tone = statusTone(order.status)
    const overdue = isOverdue(order.dueDate)
    const clickable = variant !== 'locked'
    const accent = VARIANT_ACCENT[variant]

    return (
        <Paper
            elevation={0}
            onClick={() =>
                onOpen(order.id, !!order.mine, variant === 'locked')
            }
            onKeyDown={(e) => {
                if (clickable && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault()
                    onOpen(order.id, !!order.mine, variant === 'locked')
                }
            }}
            role={clickable ? 'button' : undefined}
            tabIndex={clickable ? 0 : undefined}
            sx={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                borderLeft: `3px solid ${overdue ? 'var(--sig-fault-deep)' : accent}`,
                borderRadius: 'var(--r-2)',
                boxShadow: 'var(--elev-1)',
                overflow: 'hidden',
                cursor: clickable ? 'pointer' : 'default',
                opacity: variant === 'locked' ? 0.85 : 1,
                transition: 'all 120ms ease',
                '&:hover': clickable
                    ? {
                          borderColor: accent,
                          borderLeftColor: overdue
                              ? 'var(--sig-fault-deep)'
                              : accent,
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
                    px: 1.5,
                    py: 0.75,
                    background: 'var(--surface-2)',
                    borderBottom: '1px solid var(--line)',
                }}
            >
                <Box
                    sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: accent,
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
                    }}
                >
                    {order.number ? `#${order.number}` : '—'}
                </Typography>
                <Box sx={{ flex: 1 }} />
                {overdue && (
                    <Chip
                        size="small"
                        icon={
                            <WarnIcon
                                sx={{
                                    fontSize: '14px !important',
                                    color: 'var(--sig-fault-deep) !important',
                                }}
                            />
                        }
                        label="Overdue"
                        sx={{
                            height: 22,
                            fontFamily: 'var(--font-mono)',
                            fontSize: 11,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                            background: FAULT_TONE.bg,
                            color: FAULT_TONE.fg,
                            border: `1px solid ${FAULT_TONE.border}`,
                            '& .MuiChip-icon': { ml: '6px', mr: '-4px' },
                        }}
                    />
                )}
            </Box>

            <Box
                sx={{
                    flex: 1,
                    p: 1.5,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                }}
            >
                <Box>
                    <Typography
                        sx={{
                            fontSize: 17,
                            fontWeight: 700,
                            lineHeight: 1.25,
                            color: 'var(--ink-1)',
                            wordBreak: 'break-word',
                        }}
                    >
                        {order.processName || '—'}
                    </Typography>
                    {order.processNomenclatureName && (
                        <Typography
                            sx={{
                                mt: 0.25,
                                fontSize: 13,
                                color: 'var(--ink-2)',
                            }}
                        >
                            {order.processNomenclatureName}
                        </Typography>
                    )}
                </Box>

                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: 1,
                        rowGap: 1,
                        mt: 0.25,
                    }}
                >
                    <KeyValue label="Amount" value={`${order.amount} pcs`} />
                    {order.dueDate && (
                        <KeyValue
                            label="Due"
                            value={formatLocalDate(order.dueDate)}
                            tone={overdue ? 'fault' : undefined}
                        />
                    )}
                </Box>

                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mt: 'auto',
                        pt: 0.5,
                    }}
                >
                    <Chip
                        size="small"
                        label={statusLabel(order.status)}
                        sx={{
                            height: 24,
                            fontFamily: 'var(--font-mono)',
                            fontSize: 11,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            background: tone.bg,
                            color: tone.fg,
                            border: `1px solid ${tone.border}`,
                        }}
                    />
                    {order.executor && (
                        <Typography
                            variant="caption"
                            sx={{
                                color: 'var(--ink-3)',
                                ml: 'auto',
                                fontSize: 12,
                            }}
                        >
                            {variant === 'mine' ? (
                                <Box component="span" sx={{ fontWeight: 600 }}>
                                    You
                                </Box>
                            ) : (
                                order.executor
                            )}
                        </Typography>
                    )}
                </Box>
            </Box>

            {variant === 'locked' ? (
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 0.75,
                        px: 1.5,
                        py: 1.25,
                        background: 'var(--surface-2)',
                        borderTop: '1px solid var(--line)',
                        color: 'var(--ink-3)',
                        fontSize: 13,
                    }}
                >
                    <LockIcon fontSize="small" />
                    <Box component="span">
                        Executed by{' '}
                        <Box component="strong" sx={{ color: 'var(--ink-2)' }}>
                            {order.executor || 'another operator'}
                        </Box>
                    </Box>
                </Box>
            ) : (
                <Box
                    sx={{
                        px: 1.5,
                        py: 1.25,
                        borderTop: '1px solid var(--line)',
                    }}
                >
                    <MuiButton
                        fullWidth
                        variant="contained"
                        color={variant === 'mine' ? 'success' : 'primary'}
                        size="large"
                        startIcon={
                            variant === 'mine' ? <PlayIcon /> : <OpenIcon />
                        }
                        onClick={(e) => {
                            e.stopPropagation()
                            onOpen(order.id, !!order.mine, false)
                        }}
                        sx={{
                            fontWeight: 700,
                            fontSize: 14,
                            py: 1.25,
                            textTransform: 'none',
                        }}
                    >
                        {variant === 'mine' ? 'Continue' : 'Open'}
                    </MuiButton>
                </Box>
            )}
        </Paper>
    )
}

interface KeyValueProps {
    label: string
    value: React.ReactNode
    tone?: 'fault' | 'warn'
}

function KeyValue({ label, value, tone }: KeyValueProps) {
    const fg =
        tone === 'fault'
            ? 'var(--sig-fault-deep)'
            : tone === 'warn'
              ? 'var(--sig-warn-deep)'
              : 'var(--ink-1)'
    return (
        <Box sx={{ minWidth: 0 }}>
            <Typography sx={monoLabelSx}>{label}</Typography>
            <Typography
                sx={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: fg,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                }}
            >
                {value}
            </Typography>
        </Box>
    )
}

function EmptyMsg({ text }: { text: string }) {
    return (
        <Box
            sx={{
                py: 1.5,
                color: 'var(--ink-3)',
                fontStyle: 'italic',
                fontSize: 13,
                textAlign: 'center',
                background: 'var(--surface)',
                border: '1px dashed var(--line)',
                borderRadius: 'var(--r-2)',
            }}
        >
            {text}
        </Box>
    )
}
