import api from '@features/api/api.ts'
import { LaunchStep } from '@logistics/components/desktop/LaunchStep'
import { AllocateProcessOutput } from '@logistics/components/orders/AllocateProcessOutput'
import type {
    ExecuteResult,
    Item,
    Order,
    OrderOutputItems,
    UUID,
} from '@logistics/data/types'
import {
    useEntityToken,
    useInvalidateEntities,
} from '@logistics/hooks/entityRefresh'
import {
    useAcquireOrderClaim,
    useOrderClaimState,
} from '@logistics/hooks/entityLocks'
import { useGet } from '@logistics/hooks/hooks'
import type { RootState } from '@logistics/store'
import {
    type DateLike,
    formatLocalDate,
    formatLocalDateTime,
    formatUnits,
    parseUtcDate,
} from '@logistics/utils/format'
import { colorForGradeId } from '@logistics/utils/gradePalette'
import {
    ArrowBackOutlined as BackIcon,
    CheckOutlined as CheckIcon,
} from '@mui/icons-material'
import {
    Alert,
    Box,
    Button as MuiButton,
    Chip,
    IconButton,
    Paper,
    Typography,
} from '@mui/material'
import axios from 'axios'
import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'

type Step = 'review' | 'launch' | 'distribute' | 'complete'

const STEPS: { id: Step; label: string }[] = [
    { id: 'review', label: 'Review' },
    { id: 'launch', label: 'Launch' },
    { id: 'distribute', label: 'Distribute' },
    { id: 'complete', label: 'Done' },
]

const stepIndex = (s: Step) => STEPS.findIndex((x) => x.id === s)

export const OrderRunView = () => {
    const { id: idParam } = useParams<{ id: string }>()
    const id = idParam as UUID | undefined
    const navigate = useNavigate()

    const invalidate = useInvalidateEntities()
    const orderToken = useEntityToken([{ type: 'order', id }])
    const [launching, setLaunching] = useState(false)
    const [launchError, setLaunchError] = useState<string | undefined>()
    const [completing, setCompleting] = useState(false)
    const [completeError, setCompleteError] = useState<string | undefined>()
    const [step, setStep] = useState<Step>('review')

    const [[order], loading] = useGet<Order>(
        id ? `${api.orders}/${id}` : '',
        [id, orderToken],
    )
    const [[outputs]] = useGet<OrderOutputItems>(
        id ? `${api.orders}/${id}/output-items` : '',
        [id, orderToken],
    )

    // Claim the order for as long as the operator stays in this view, so
    // other tabs/users see "Executing by {username}" the same way they
    // see a persisted Executor banner.
    const username = useSelector((s: RootState) => s.user.name)
    const claim = useOrderClaimState(id)
    const claimedByOther = !!claim.lockedBy && !claim.isOwn
    const claimable =
        !!id && !!order && order.status !== 'Completed' && !order.executor
    useAcquireOrderClaim(id, claimable, username)

    const occupiedBy =
        order?.executor || (claimedByOther ? claim.lockedBy : null)
    const isReadOnly =
        (!!order?.executor && order.mine === false) || claimedByOther
    const isAlreadyLaunched = !!order && order.status !== 'Draft'
    const isCompleted = order?.status === 'Completed'
    const unallocatedCount = outputs?.unallocated?.length ?? 0
    const allocatedCount = outputs?.allocated?.length ?? 0
    const allAllocated =
        isAlreadyLaunched &&
        allocatedCount + unallocatedCount > 0 &&
        unallocatedCount === 0

    const liveStep: Step = useMemo(() => {
        if (!order) return 'review'
        if (isCompleted || allAllocated) return 'complete'
        if (isAlreadyLaunched) return 'distribute'
        return 'review'
    }, [order, isAlreadyLaunched, isCompleted, allAllocated])

    const [maxStep, setMaxStep] = useState<Step>('review')

    useEffect(() => {
        if (stepIndex(liveStep) > stepIndex(maxStep)) setMaxStep(liveStep)
    }, [liveStep, maxStep])

    useEffect(() => {
        if (stepIndex(step) > stepIndex(maxStep)) setMaxStep(step)
    }, [step, maxStep])

    useEffect(() => {
        if (!order) return
        setStep(liveStep)
    }, [order, liveStep])

    const activeStepIndex = stepIndex(step)
    const liveStepIndex = stepIndex(liveStep)
    const maxStepIndex = stepIndex(maxStep)

    const isOnPastStep = activeStepIndex < liveStepIndex

    const launch = () => {
        if (!id || isReadOnly) return
        setLaunchError(undefined)
        setLaunching(true)
        axios
            .post<ExecuteResult>(`${api.orders}/${id}/execute`)
            .then((r) => {
                invalidate([
                    { type: 'order', id },
                    { type: 'item' },
                    { type: 'tare' },
                ])
                if (r.data.completed) setStep('complete')
                else setStep('distribute')
            })
            .catch((e) => {
                setLaunchError(
                    e.response?.data?.detail ||
                        e.response?.statusText ||
                        'Failed to launch',
                )
            })
            .finally(() => setLaunching(false))
    }

    const completeOrder = () => {
        if (!id || isReadOnly || completing) return
        setCompleteError(undefined)
        setCompleting(true)
        axios
            .post(`${api.orders}/${id}/complete`, {})
            .then(() => invalidate([{ type: 'order', id }]))
            .catch((e) => {
                setCompleteError(
                    e.response?.data?.detail ||
                        e.response?.statusText ||
                        'Failed to complete the order',
                )
            })
            .finally(() => setCompleting(false))
    }

    const onOutputsChanged = () =>
        invalidate([
            { type: 'order', id },
            { type: 'item' },
            { type: 'tare' },
        ])

    const backToList = () => navigate('/desktop')

    const tryGoToStep = (target: Step) => {
        if (stepIndex(target) <= maxStepIndex) setStep(target)
    }

    return (
        <Paper
            elevation={0}
            sx={{
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                borderRadius: 'var(--r-2)',
                boxShadow: 'var(--elev-1)',
                p: 1.5,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 'calc(100vh - 170px)',
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 1,
                }}
            >
                <IconButton
                    size="small"
                    onClick={backToList}
                    sx={{ color: 'var(--accent)' }}
                >
                    <BackIcon fontSize="small" />
                </IconButton>
                <Typography
                    sx={{
                        flex: 1,
                        fontSize: 18,
                        fontWeight: 700,
                        color: 'var(--ink-1)',
                    }}
                >
                    {order?.processName || (loading ? 'Loading…' : 'Order')}
                </Typography>
                {order?.processNomenclatureName && (
                    <Typography
                        variant="caption"
                        sx={{ color: 'var(--ink-3)' }}
                    >
                        {order.processNomenclatureName} · {order.amount} pcs
                    </Typography>
                )}
            </Box>

            {isReadOnly && (
                <Alert severity="warning" sx={{ mb: 1 }}>
                    {order?.executor ? 'Executed' : 'Executing'} by{' '}
                    <strong>{occupiedBy}</strong> — read-only. You can view
                    progress but cannot change anything.
                </Alert>
            )}

            <Stepper
                step={step}
                liveStep={liveStep}
                maxStep={maxStep}
                onPick={tryGoToStep}
            />

            {isOnPastStep && (
                <ReviewBanner
                    liveStep={liveStep}
                    onResume={() => setStep(liveStep)}
                />
            )}

            <Box
                sx={{
                    flex: 1,
                    minHeight: 0,
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {step === 'review' && order && (
                    <ReviewStep
                        order={order}
                        onNext={() => setStep('launch')}
                        nextLabel={isOnPastStep ? 'Continue review' : 'Next'}
                        onResume={
                            isOnPastStep ? () => setStep(liveStep) : undefined
                        }
                    />
                )}
                {step === 'launch' && id && (
                    <LaunchStep
                        orderId={id}
                        onLaunch={launch}
                        launching={launching}
                        launchError={launchError}
                        readOnly={isReadOnly}
                        reviewOnly={isOnPastStep}
                        onResume={
                            isOnPastStep ? () => setStep(liveStep) : undefined
                        }
                    />
                )}
                {step === 'distribute' && id && (
                    <AllocateProcessOutput
                        orderId={id}
                        onChanged={onOutputsChanged}
                        onClose={() => {
                            if (allAllocated) setStep('complete')
                            else backToList()
                        }}
                    />
                )}
                {step === 'complete' && order && (
                    <CompleteStep
                        order={order}
                        allocatedCount={allocatedCount}
                        unallocatedCount={unallocatedCount}
                        outputs={outputs}
                        onComplete={completeOrder}
                        completing={completing}
                        completeError={completeError}
                        isCompleted={isCompleted}
                        readOnly={isReadOnly}
                        onBackToList={backToList}
                    />
                )}
            </Box>
        </Paper>
    )
}

interface StepperProps {
    step: Step
    liveStep: Step
    maxStep: Step
    onPick: (s: Step) => void
}

function Stepper({ step, liveStep, maxStep, onPick }: StepperProps) {
    const activeIdx = stepIndex(step)
    const liveIdx = stepIndex(liveStep)
    const maxIdx = stepIndex(maxStep)

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                mt: 0.25,
                mb: 1.25,
                overflowX: 'auto',
            }}
        >
            {STEPS.map((s, idx) => {
                const reachable = idx <= maxIdx
                const isLive = idx === liveIdx
                const isDone = idx < liveIdx
                const isViewing = idx === activeIdx
                const baseBg = isLive
                    ? 'var(--accent)'
                    : isDone
                      ? 'var(--sig-run-soft)'
                      : 'var(--surface-2)'
                const baseFg = isLive
                    ? '#fff'
                    : isDone
                      ? 'var(--sig-run-deep)'
                      : 'var(--ink-3)'
                const fontWeight = isLive ? 700 : isDone ? 600 : 500
                return (
                    <MuiButton
                        key={s.id}
                        type="button"
                        disabled={!reachable}
                        onClick={() => reachable && onPick(s.id)}
                        sx={{
                            flex: 1,
                            minWidth: 120,
                            py: 1,
                            px: 1,
                            background: baseBg,
                            color: baseFg,
                            fontWeight,
                            fontSize: 14,
                            textTransform: 'none',
                            borderRadius: 'var(--r-2)',
                            border: 'none',
                            cursor: reachable ? 'pointer' : 'default',
                            outline: 'none',
                            boxShadow: isViewing
                                ? 'inset 0 0 0 2px var(--ink-2)'
                                : 'none',
                            '&:hover': reachable
                                ? {
                                      background: baseBg,
                                      filter: 'brightness(0.96)',
                                  }
                                : undefined,
                            '&.Mui-disabled': {
                                background: baseBg,
                                color: baseFg,
                                opacity: 0.6,
                            },
                        }}
                    >
                        {isDone ? (
                            <CheckIcon
                                fontSize="small"
                                sx={{ mr: 0.5, fontSize: 16 }}
                            />
                        ) : (
                            <Box
                                component="span"
                                sx={{
                                    fontFamily: 'var(--font-mono)',
                                    mr: 0.5,
                                    opacity: 0.8,
                                }}
                            >
                                {idx + 1}.
                            </Box>
                        )}
                        {s.label}
                    </MuiButton>
                )
            })}
        </Box>
    )
}

function ReviewBanner({
    liveStep,
    onResume,
}: { liveStep: Step; onResume: () => void }) {
    const liveLabel =
        liveStep === 'distribute'
            ? 'Distribute'
            : liveStep === 'complete'
              ? 'Done'
              : 'Launch'
    return (
        <Alert
            severity="info"
            sx={{ mb: 1, alignItems: 'center' }}
            action={
                <MuiButton size="small" variant="contained" onClick={onResume}>
                    Resume
                </MuiButton>
            }
        >
            Reviewing — order is currently at <strong>{liveLabel}</strong>.
        </Alert>
    )
}

type ReviewStepProps = {
    order: Order
    onNext: () => void
    nextLabel: string
    onResume?: () => void
}

const ReviewStep = ({
    order,
    onNext,
    nextLabel,
    onResume,
}: ReviewStepProps) => (
    <Box>
        <Box
            sx={{
                display: 'grid',
                gridTemplateColumns: '160px 1fr',
                gap: '6px 16px',
                alignItems: 'baseline',
                fontSize: 16,
            }}
        >
            <ReviewLabel>Process</ReviewLabel>
            <ReviewValue>{order.processName}</ReviewValue>
            <ReviewLabel>Nomenclature</ReviewLabel>
            <ReviewValue>{order.processNomenclatureName ?? '—'}</ReviewValue>
            <ReviewLabel>Amount</ReviewLabel>
            <ReviewValue>
                {formatUnits(
                    order.amount,
                    order.processNomenclatureUnits,
                    order.processNomenclatureCountable,
                )}
            </ReviewValue>
            {order.startDate && (
                <>
                    <ReviewLabel>Start</ReviewLabel>
                    <ReviewValue>
                        {formatLocalDate(order.startDate)}
                    </ReviewValue>
                </>
            )}
            {order.dueDate && (
                <>
                    <ReviewLabel>Due</ReviewLabel>
                    <ReviewValue>{formatLocalDate(order.dueDate)}</ReviewValue>
                </>
            )}
            {order.description && (
                <>
                    <ReviewLabel>Description</ReviewLabel>
                    <ReviewValue>{order.description}</ReviewValue>
                </>
            )}
        </Box>

        <Footer>
            <MuiButton
                variant="contained"
                color="primary"
                size="large"
                onClick={onResume ?? onNext}
                sx={{ minWidth: 180 }}
            >
                {onResume ? 'Resume' : nextLabel}
            </MuiButton>
        </Footer>
    </Box>
)

function ReviewLabel({ children }: { children: React.ReactNode }) {
    return (
        <Box
            component="span"
            sx={{ color: 'var(--ink-3)', fontWeight: 500 }}
        >
            {children}
        </Box>
    )
}

function ReviewValue({ children }: { children: React.ReactNode }) {
    return (
        <Box component="span" sx={{ color: 'var(--ink-1)' }}>
            {children}
        </Box>
    )
}

function Footer({ children }: { children: React.ReactNode }) {
    return (
        <Box
            sx={{
                mt: 2,
                pt: 2,
                borderTop: '1px solid var(--line)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 1,
            }}
        >
            {children}
        </Box>
    )
}

type CompleteStepProps = {
    order: Order
    allocatedCount: number
    unallocatedCount: number
    outputs?: OrderOutputItems
    onComplete: () => void
    completing: boolean
    completeError?: string
    isCompleted: boolean
    readOnly: boolean
    onBackToList: () => void
}

type GradeBucket = {
    gradeId: UUID | null
    gradeName: string
    color?: string
    quantity: number
}

const groupByGrade = (items: Item[]): GradeBucket[] => {
    const map = new Map<string, GradeBucket>()
    for (const item of items) {
        const key = item.gradeId ?? '__none__'
        if (!map.has(key)) {
            map.set(key, {
                gradeId: item.gradeId ?? null,
                gradeName: item.gradeName ?? 'No grade',
                color: item.gradeId
                    ? colorForGradeId(item.gradeId)
                    : '#e3f2fd',
                quantity: 0,
            })
        }
        map.get(key)!.quantity += item.quantity ?? 0
    }
    return Array.from(map.values()).sort((a, b) => {
        if (a.gradeId === null) return 1
        if (b.gradeId === null) return -1
        return a.gradeName.localeCompare(b.gradeName)
    })
}

type DueStatus =
    | { kind: 'on-time'; label: string }
    | { kind: 'overdue'; label: string }
    | { kind: 'ahead'; label: string }

const computeDueStatus = (
    dueRaw: DateLike,
    completedRaw?: DateLike,
): DueStatus | undefined => {
    const due = parseUtcDate(dueRaw)
    if (!due) return undefined
    const ref = parseUtcDate(completedRaw) ?? new Date()
    const dueDay = Date.UTC(due.getFullYear(), due.getMonth(), due.getDate())
    const refDay = Date.UTC(ref.getFullYear(), ref.getMonth(), ref.getDate())
    const diffDays = Math.round((refDay - dueDay) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return { kind: 'on-time', label: 'In time' }
    if (diffDays > 0) return { kind: 'overdue', label: `Overdue ${diffDays} d` }
    return { kind: 'ahead', label: `${-diffDays} d before plan` }
}

const DUE_TONE: Record<DueStatus['kind'], StatusTone> = {
    'on-time': {
        bg: 'var(--ent-supply-soft)',
        fg: 'var(--ent-supply-deep)',
        border: 'var(--ent-supply-deep)',
    },
    overdue: {
        bg: 'var(--sig-fault-soft)',
        fg: 'var(--sig-fault-deep)',
        border: 'var(--sig-fault-deep)',
    },
    ahead: {
        bg: 'var(--sig-run-soft)',
        fg: 'var(--sig-run-deep)',
        border: 'var(--sig-run-deep)',
    },
}

interface StatusTone {
    bg: string
    fg: string
    border: string
}

const CompleteStep = ({
    order,
    allocatedCount,
    unallocatedCount,
    outputs,
    onComplete,
    completing,
    completeError,
    isCompleted,
    readOnly,
    onBackToList,
}: CompleteStepProps) => {
    const distinctTares = useMemo(() => {
        const ids = new Set<string>()
        for (const item of outputs?.allocated ?? []) {
            if (item.tareId) ids.add(item.tareId)
        }
        return ids.size
    }, [outputs])

    const allocatedQty = useMemo(
        () =>
            (outputs?.allocated ?? []).reduce(
                (s, i) => s + (i.quantity ?? 0),
                0,
            ),
        [outputs],
    )
    const totalQty = useMemo(
        () =>
            allocatedQty +
            (outputs?.unallocated ?? []).reduce(
                (s, i) => s + (i.quantity ?? 0),
                0,
            ),
        [allocatedQty, outputs],
    )
    const units = order.processNomenclatureUnits
    const countable = order.processNomenclatureCountable

    const gradeBuckets = useMemo(
        () =>
            groupByGrade([
                ...(outputs?.allocated ?? []),
                ...(outputs?.unallocated ?? []),
            ]),
        [outputs],
    )

    const dueStatus = useMemo(
        () => computeDueStatus(order.dueDate, order.completed),
        [order.dueDate, order.completed],
    )

    return (
        <Paper
            elevation={0}
            sx={{
                maxWidth: 640,
                mx: 'auto',
                mt: 3,
                p: '32px 40px 24px',
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                borderRadius: 'var(--r-2)',
                boxShadow: 'var(--elev-2)',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
            }}
        >
            <Typography
                sx={{
                    fontSize: 24,
                    fontWeight: 700,
                    color: 'var(--sig-run-deep)',
                }}
            >
                {isCompleted ? 'Order completed' : 'Ready to complete'}
            </Typography>
            <Typography sx={{ color: 'var(--ink-2)', fontSize: 16, mb: 0.5 }}>
                {isCompleted
                    ? 'All done.'
                    : 'Every output is allocated. Confirm to close the order.'}
            </Typography>

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(140px, max-content) 1fr',
                    gap: '6px 24px',
                    textAlign: 'left',
                    width: 'max-content',
                    maxWidth: '100%',
                    mx: 'auto',
                    mt: 1,
                    fontSize: 15,
                }}
            >
                <DoneLabel>Nomenclature</DoneLabel>
                <DoneValue>{order.processNomenclatureName ?? '—'}</DoneValue>
                <DoneLabel>Amount</DoneLabel>
                <DoneValue>{formatUnits(order.amount, units, countable)}</DoneValue>
                <DoneLabel>Outputs allocated</DoneLabel>
                <DoneValue>
                    {formatUnits(allocatedQty, units, countable)} /{' '}
                    {formatUnits(totalQty, units, countable)}
                </DoneValue>
                <DoneLabel>Tares used</DoneLabel>
                <DoneValue>{distinctTares}</DoneValue>
                {order.executor && (
                    <>
                        <DoneLabel>Executor</DoneLabel>
                        <DoneValue>{order.executor}</DoneValue>
                    </>
                )}
                {order.dueDate && (
                    <>
                        <DoneLabel>Due</DoneLabel>
                        <DoneValue>
                            <Box
                                component="span"
                                sx={{ mr: 1 }}
                            >
                                {formatLocalDate(order.dueDate)}
                            </Box>
                            {dueStatus && (
                                <Chip
                                    size="small"
                                    label={dueStatus.label}
                                    sx={{
                                        height: 22,
                                        fontSize: 11,
                                        fontWeight: 700,
                                        fontFamily: 'var(--font-mono)',
                                        background:
                                            DUE_TONE[dueStatus.kind].bg,
                                        color:
                                            DUE_TONE[dueStatus.kind].fg,
                                        border: `1px solid ${DUE_TONE[dueStatus.kind].border}`,
                                    }}
                                />
                            )}
                        </DoneValue>
                    </>
                )}
                {order.completed && (
                    <>
                        <DoneLabel>Completed</DoneLabel>
                        <DoneValue>
                            {formatLocalDateTime(order.completed)}
                        </DoneValue>
                    </>
                )}
            </Box>

            {gradeBuckets.length > 0 && (
                <Box
                    sx={{
                        textAlign: 'left',
                        width: '100%',
                        maxWidth: 460,
                        mx: 'auto',
                        mt: 1,
                    }}
                >
                    <Typography
                        sx={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 11,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.07em',
                            color: 'var(--ink-3)',
                            mb: 0.75,
                        }}
                    >
                        By grade
                    </Typography>
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 0.5,
                        }}
                    >
                        {gradeBuckets.map((g) => (
                            <Box
                                key={g.gradeId ?? 'no-grade'}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    px: 1,
                                    py: 0.5,
                                    borderRadius: 'var(--r-2)',
                                    background: 'var(--surface-2)',
                                    border: '1px solid var(--line)',
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 14,
                                        height: 14,
                                        borderRadius: '3px',
                                        background: g.color ?? '#eee',
                                        border: '1px solid rgba(0,0,0,0.15)',
                                        flexShrink: 0,
                                    }}
                                />
                                <Box sx={{ flex: 1, color: 'var(--ink-1)' }}>
                                    {g.gradeName}
                                </Box>
                                <Box
                                    sx={{
                                        color: 'var(--ink-2)',
                                        fontFamily: 'var(--font-mono)',
                                        fontWeight: 700,
                                    }}
                                >
                                    {formatUnits(g.quantity, units, countable)}
                                </Box>
                            </Box>
                        ))}
                    </Box>
                </Box>
            )}

            {completeError && (
                <Alert severity="error" sx={{ mt: 1 }}>
                    {completeError}
                </Alert>
            )}

            <Box
                sx={{
                    mt: 2,
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 1,
                }}
            >
                {isCompleted ? (
                    <MuiButton
                        variant="contained"
                        size="large"
                        onClick={onBackToList}
                        sx={{ minWidth: 180 }}
                    >
                        Back to list
                    </MuiButton>
                ) : (
                    <MuiButton
                        variant="contained"
                        color="success"
                        size="large"
                        onClick={onComplete}
                        disabled={
                            readOnly || completing || unallocatedCount > 0
                        }
                        title={
                            readOnly
                                ? 'Read-only'
                                : unallocatedCount > 0
                                  ? 'All outputs must be allocated before completing'
                                  : undefined
                        }
                        sx={{ minWidth: 180 }}
                    >
                        {readOnly
                            ? 'Read-only'
                            : completing
                              ? 'Completing…'
                              : 'Complete order'}
                    </MuiButton>
                )}
            </Box>
        </Paper>
    )
}

function DoneLabel({ children }: { children: React.ReactNode }) {
    return (
        <Box component="span" sx={{ color: 'var(--ink-3)', fontWeight: 500 }}>
            {children}
        </Box>
    )
}

function DoneValue({ children }: { children: React.ReactNode }) {
    return (
        <Box component="span" sx={{ color: 'var(--ink-1)', fontWeight: 500 }}>
            {children}
        </Box>
    )
}
