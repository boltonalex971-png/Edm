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
    Tooltip,
    Typography,
} from '@mui/material'
import axios from 'axios'
import { Fragment, useEffect, useMemo, useState } from 'react'
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

const DUE_TONE: Record<'on-time' | 'overdue' | 'ahead', Tone> = {
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

const monoEyebrowSx = {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    color: 'var(--ink-3)',
}

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

    const backToList = () => navigate('/')

    const tryGoToStep = (target: Step) => {
        if (stepIndex(target) <= maxStepIndex) setStep(target)
    }

    const statusTone =
        (order?.status && STATUS_TONE[order.status]) || DRAFT_TONE
    const statusLabel =
        order?.status === 'OutputsPending'
            ? 'Outputs pending'
            : order?.status || 'Draft'

    return (
        <Paper
            elevation={0}
            sx={{
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                borderRadius: 'var(--r-2)',
                boxShadow: 'var(--elev-1)',
                display: 'flex',
                flexDirection: 'column',
                minHeight: 'calc(100vh - 170px)',
                overflow: 'hidden',
            }}
        >
            <RunHeader
                order={order}
                loading={loading}
                statusTone={statusTone}
                statusLabel={statusLabel}
                onBack={backToList}
            />

            {isReadOnly && (
                <Alert
                    severity="warning"
                    sx={{ mx: 1.5, mb: 1, borderRadius: 'var(--r-2)' }}
                >
                    {order?.executor ? 'Executed' : 'Executing'} by{' '}
                    <Box
                        component="strong"
                        sx={{ fontFamily: 'var(--font-mono)' }}
                    >
                        {occupiedBy}
                    </Box>{' '}
                    — read-only. You can view progress but cannot change
                    anything.
                </Alert>
            )}

            <Stepper
                step={step}
                liveStep={liveStep}
                maxStep={maxStep}
                onPick={tryGoToStep}
            />

            {isOnPastStep && (
                <Alert
                    severity="info"
                    sx={{ mx: 1.5, mb: 1.5, borderRadius: 'var(--r-2)' }}
                    action={
                        <MuiButton
                            size="small"
                            variant="contained"
                            onClick={() => setStep(liveStep)}
                        >
                            Resume
                        </MuiButton>
                    }
                >
                    Reviewing earlier step — order is currently at{' '}
                    <Box
                        component="strong"
                        sx={{ fontFamily: 'var(--font-mono)' }}
                    >
                        {STEPS[liveStepIndex].label}
                    </Box>
                    .
                </Alert>
            )}

            <Box
                sx={{
                    flex: 1,
                    minHeight: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    px: 1.5,
                    pb: 1.5,
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

interface RunHeaderProps {
    order: Order | undefined
    loading: boolean
    statusTone: Tone
    statusLabel: string
    onBack: () => void
}

function RunHeader({
    order,
    loading,
    statusTone,
    statusLabel,
    onBack,
}: RunHeaderProps) {
    return (
        <Box
            sx={{
                px: 1.5,
                py: 1.25,
                background: 'var(--surface-2)',
                borderBottom: '1px solid var(--line)',
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 0.75,
                }}
            >
                <Tooltip title="Back to orders">
                    <IconButton
                        size="small"
                        onClick={onBack}
                        sx={{
                            color: 'var(--ink-2)',
                            '&:hover': { color: 'var(--accent)' },
                        }}
                    >
                        <BackIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Typography sx={monoEyebrowSx}>
                    Order
                    {order?.number && (
                        <Box
                            component="span"
                            sx={{
                                ml: 1,
                                color: 'var(--ink-1)',
                                fontWeight: 700,
                                letterSpacing: '0.02em',
                            }}
                        >
                            #{order.number}
                        </Box>
                    )}
                </Typography>
                <Box sx={{ flex: 1 }} />
                {order && (
                    <Chip
                        size="small"
                        label={statusLabel}
                        sx={{
                            height: 22,
                            fontFamily: 'var(--font-mono)',
                            fontSize: 11,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            background: statusTone.bg,
                            color: statusTone.fg,
                            border: `1px solid ${statusTone.border}`,
                        }}
                    />
                )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5 }}>
                <Typography
                    sx={{
                        fontSize: 22,
                        fontWeight: 700,
                        lineHeight: 1.2,
                        color: 'var(--ink-1)',
                        wordBreak: 'break-word',
                    }}
                >
                    {order?.processName ||
                        (loading ? 'Loading…' : 'Order')}
                </Typography>
            </Box>
            {order?.processNomenclatureName && (
                <Typography
                    sx={{ mt: 0.25, color: 'var(--ink-2)', fontSize: 14 }}
                >
                    {order.processNomenclatureName}
                    <Box
                        component="span"
                        sx={{ color: 'var(--ink-3)', mx: 1 }}
                    >
                        ·
                    </Box>
                    <Box
                        component="span"
                        sx={{
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--ink-1)',
                            fontWeight: 700,
                        }}
                    >
                        {order.amount} pcs
                    </Box>
                </Typography>
            )}
        </Box>
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
                px: { xs: 2, md: 3 },
                py: 1.5,
                borderBottom: '1px solid var(--line)',
            }}
        >
            {/* Auto-sized step buttons separated by flex:1 connectors so all
                connector lines render at equal length. Wrapper has maxWidth +
                mx:auto so the whole stepper sits centered with breathing room
                on either side instead of stretching edge-to-edge. */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    maxWidth: 1080,
                    mx: 'auto',
                }}
            >
                {STEPS.map((s, idx) => {
                    const reachable = idx <= maxIdx
                    const isLive = idx === liveIdx
                    const isDone = idx < liveIdx
                    const isViewing = idx === activeIdx
                    return (
                        <Fragment key={s.id}>
                            {idx > 0 && (
                                <Connector active={idx <= liveIdx} />
                            )}
                            <StepNode
                                label={s.label}
                                number={idx + 1}
                                reachable={reachable}
                                isLive={isLive}
                                isDone={isDone}
                                isViewing={isViewing}
                                onClick={() => reachable && onPick(s.id)}
                            />
                        </Fragment>
                    )
                })}
            </Box>
        </Box>
    )
}

function Connector({ active }: { active: boolean }) {
    return (
        <Box
            sx={{
                flex: 1,
                height: 2,
                background: active
                    ? 'var(--sig-run-deep)'
                    : 'var(--line-strong)',
                borderRadius: 1,
            }}
        />
    )
}

interface StepNodeProps {
    label: string
    number: number
    reachable: boolean
    isLive: boolean
    isDone: boolean
    isViewing: boolean
    onClick: () => void
}

function StepNode({
    label,
    number,
    reachable,
    isLive,
    isDone,
    isViewing,
    onClick,
}: StepNodeProps) {
    let circleBg = 'var(--surface)'
    let circleFg = 'var(--ink-3)'
    let circleBorder = 'var(--line-strong)'
    if (isDone) {
        circleBg = 'var(--sig-run-deep)'
        circleFg = '#fff'
        circleBorder = 'var(--sig-run-deep)'
    } else if (isLive) {
        circleBg = 'var(--accent)'
        circleFg = '#fff'
        circleBorder = 'var(--accent)'
    } else if (!reachable) {
        circleBg = 'var(--surface-2)'
        circleFg = 'var(--ink-4)'
        circleBorder = 'var(--line)'
    }

    const labelColor = isLive
        ? 'var(--accent)'
        : isDone
          ? 'var(--sig-run-deep)'
          : reachable
            ? 'var(--ink-2)'
            : 'var(--ink-4)'

    return (
        <Box
            role="button"
            aria-current={isViewing ? 'step' : undefined}
            aria-disabled={!reachable}
            tabIndex={reachable ? 0 : -1}
            onClick={onClick}
            onKeyDown={(e) => {
                if (reachable && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault()
                    onClick()
                }
            }}
            sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                px: 0.5,
                py: 0.5,
                borderRadius: 'var(--r-2)',
                cursor: reachable ? 'pointer' : 'default',
                flexShrink: 0,
                // Outline tracks the step's own state colour so the focus
                // brackets read amber for live, green for done, grey for unreached.
                outline: isViewing ? `2px solid ${circleBorder}` : 'none',
                outlineOffset: 2,
                '&:hover': reachable
                    ? { background: 'var(--surface-2)' }
                    : undefined,
                '&:focus-visible': {
                    outline: `2px solid ${circleBorder}`,
                    outlineOffset: 2,
                },
            }}
        >
            <Box
                sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: circleBg,
                    color: circleFg,
                    border: `2px solid ${circleBorder}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 14,
                    fontWeight: 700,
                    flexShrink: 0,
                }}
            >
                {isDone ? <CheckIcon sx={{ fontSize: 18 }} /> : number}
            </Box>
            <Typography
                sx={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                    color: labelColor,
                    whiteSpace: 'nowrap',
                }}
            >
                {label}
            </Typography>
        </Box>
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
}: ReviewStepProps) => {
    const dueStatus = useMemo(
        () => computeDueStatus(order.dueDate),
        [order.dueDate],
    )
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1 }}>
            <Typography sx={monoEyebrowSx}>Order details</Typography>
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(160px, max-content) 1fr',
                    gap: '8px 24px',
                    alignItems: 'baseline',
                    background: 'var(--surface-2)',
                    border: '1px solid var(--line)',
                    borderRadius: 'var(--r-2)',
                    p: 1.5,
                }}
            >
                <ReviewLabel>Process</ReviewLabel>
                <ReviewValue>{order.processName}</ReviewValue>
                <ReviewLabel>Nomenclature</ReviewLabel>
                <ReviewValue>
                    {order.processNomenclatureName ?? '—'}
                </ReviewValue>
                <ReviewLabel>Amount</ReviewLabel>
                <ReviewValue mono>
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
                        <ReviewValue>
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
                        </ReviewValue>
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
                    sx={{ minWidth: 200, fontWeight: 700 }}
                >
                    {onResume ? 'Resume' : nextLabel}
                </MuiButton>
            </Footer>
        </Box>
    )
}

function ReviewLabel({ children }: { children: React.ReactNode }) {
    return (
        <Box
            component="span"
            sx={{
                ...monoEyebrowSx,
                fontSize: 11,
                color: 'var(--ink-3)',
            }}
        >
            {children}
        </Box>
    )
}

function ReviewValue({
    children,
    mono,
}: { children: React.ReactNode; mono?: boolean }) {
    return (
        <Box
            component="span"
            sx={{
                color: 'var(--ink-1)',
                fontWeight: mono ? 700 : 500,
                fontFamily: mono ? 'var(--font-mono)' : 'inherit',
                fontSize: 14,
            }}
        >
            {children}
        </Box>
    )
}

function Footer({ children }: { children: React.ReactNode }) {
    return (
        <Box
            sx={{
                mt: 'auto',
                pt: 1.5,
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
    if (diffDays > 0)
        return { kind: 'overdue', label: `Overdue ${diffDays} d` }
    return { kind: 'ahead', label: `${-diffDays} d before plan` }
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
                maxWidth: 720,
                mx: 'auto',
                mt: 3,
                p: '32px 40px 24px',
                background: 'var(--surface)',
                border: `1px solid ${isCompleted ? 'var(--sig-run-deep)' : 'var(--line)'}`,
                borderRadius: 'var(--r-2)',
                boxShadow: 'var(--elev-2)',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
            }}
        >
            <Box
                sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: isCompleted
                        ? 'var(--sig-run-deep)'
                        : 'var(--sig-run-soft)',
                    color: isCompleted ? '#fff' : 'var(--sig-run-deep)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 0.5,
                }}
            >
                <CheckIcon sx={{ fontSize: 32 }} />
            </Box>
            <Typography
                sx={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: 'var(--sig-run-deep)',
                }}
            >
                {isCompleted ? 'Order completed' : 'Ready to complete'}
            </Typography>
            <Typography sx={{ color: 'var(--ink-2)', fontSize: 14, mb: 1 }}>
                {isCompleted
                    ? 'All done.'
                    : 'Every output is allocated. Confirm to close the order.'}
            </Typography>

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns:
                        'minmax(160px, max-content) 1fr',
                    gap: '8px 24px',
                    textAlign: 'left',
                    width: 'max-content',
                    maxWidth: '100%',
                    mx: 'auto',
                    mt: 1,
                    p: 1.5,
                    background: 'var(--surface-2)',
                    border: '1px solid var(--line)',
                    borderRadius: 'var(--r-2)',
                }}
            >
                <ReviewLabel>Nomenclature</ReviewLabel>
                <ReviewValue>
                    {order.processNomenclatureName ?? '—'}
                </ReviewValue>
                <ReviewLabel>Amount</ReviewLabel>
                <ReviewValue mono>
                    {formatUnits(order.amount, units, countable)}
                </ReviewValue>
                <ReviewLabel>Outputs allocated</ReviewLabel>
                <ReviewValue mono>
                    {formatUnits(allocatedQty, units, countable)} /{' '}
                    {formatUnits(totalQty, units, countable)}
                </ReviewValue>
                <ReviewLabel>Tares used</ReviewLabel>
                <ReviewValue mono>{distinctTares}</ReviewValue>
                {order.executor && (
                    <>
                        <ReviewLabel>Executor</ReviewLabel>
                        <ReviewValue>{order.executor}</ReviewValue>
                    </>
                )}
                {order.dueDate && (
                    <>
                        <ReviewLabel>Due</ReviewLabel>
                        <ReviewValue>
                            <Box component="span" sx={{ mr: 1 }}>
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
                        </ReviewValue>
                    </>
                )}
                {order.completed && (
                    <>
                        <ReviewLabel>Completed</ReviewLabel>
                        <ReviewValue>
                            {formatLocalDateTime(order.completed)}
                        </ReviewValue>
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
                        mt: 1.5,
                    }}
                >
                    <Typography sx={{ ...monoEyebrowSx, mb: 0.75 }}>
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
                                    background: 'var(--surface)',
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
                        sx={{ minWidth: 200, fontWeight: 700 }}
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
                        sx={{ minWidth: 200, fontWeight: 700 }}
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
