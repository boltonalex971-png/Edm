import api from '@features/api/api.ts'
import '@logistics/components/desktop' // side-effect: registers the `desktop` namespace
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
    EventOutlined as DueIcon,
    Inventory2Outlined as QuantityIcon,
    NotesOutlined as NotesIcon,
    PlayArrowOutlined as PlayIcon,
    TodayOutlined as StartIcon,
    WidgetsOutlined as TaresIcon,
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
import { Trans, useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'

type Step = 'review' | 'launch' | 'distribute' | 'complete'

const STEP_IDS: Step[] = ['review', 'launch', 'distribute', 'complete']
const STEP_LABEL_KEYS: Record<Step, string> = {
    review: 'steps.review',
    launch: 'steps.launch',
    distribute: 'steps.distribute',
    complete: 'steps.done',
}

const stepIndex = (s: Step) => STEP_IDS.indexOf(s)

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
    const { t } = useTranslation('desktop')
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
                        t('run.failedToLaunch'),
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
                        t('run.failedToComplete'),
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
    const statusLabel = t(`widgets:status.${order?.status ?? 'Draft'}`)

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
                    <Trans
                        i18nKey={
                            order?.executor
                                ? 'desktop:run.executedReadOnly'
                                : 'desktop:run.executingReadOnly'
                        }
                        values={{ name: occupiedBy ?? '' }}
                        components={[
                            <Box
                                key="0"
                                component="strong"
                                sx={{ fontFamily: 'var(--font-mono)' }}
                            />,
                        ]}
                    />
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
                            {t('run.resume')}
                        </MuiButton>
                    }
                >
                    <Trans
                        i18nKey="desktop:run.reviewingEarlier"
                        values={{
                            step: t(STEP_LABEL_KEYS[STEP_IDS[liveStepIndex]]),
                        }}
                        components={[
                            <Box
                                key="0"
                                component="strong"
                                sx={{ fontFamily: 'var(--font-mono)' }}
                            />,
                        ]}
                    />
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
                        nextLabel={
                            isOnPastStep
                                ? t('review.continueReview')
                                : t('review.next')
                        }
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
    const { t } = useTranslation('desktop')
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
                <Tooltip title={t('run.backToOrders')}>
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
                    {t('run.order')}
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
                        (loading ? t('common:loading') : t('run.orderFallback'))}
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
                        {t('run.amountPcs', { count: order.amount })}
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
    const { t } = useTranslation('desktop')
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
                {STEP_IDS.map((sid, idx) => {
                    const reachable = idx <= maxIdx
                    const isLive = idx === liveIdx
                    const isDone = idx < liveIdx
                    const isViewing = idx === activeIdx
                    return (
                        <Fragment key={sid}>
                            {idx > 0 && (
                                <Connector active={idx <= liveIdx} />
                            )}
                            <StepNode
                                label={t(STEP_LABEL_KEYS[sid])}
                                number={idx + 1}
                                reachable={reachable}
                                isLive={isLive}
                                isDone={isDone}
                                isViewing={isViewing}
                                onClick={() => reachable && onPick(sid)}
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
    const { t } = useTranslation('desktop')
    const dueStatus = useMemo(
        () => computeDueStatus(order.dueDate, undefined, t),
        [order.dueDate, t],
    )
    const amountLabel = formatUnits(
        order.amount,
        order.processNomenclatureUnits,
        order.processNomenclatureCountable,
    )
    const dueTone = dueStatus ? DUE_TONE[dueStatus.kind] : undefined
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                mt: 1,
                maxWidth: 980,
                width: '100%',
                mx: 'auto',
            }}
        >
            <Typography sx={monoEyebrowSx}>{t('review.summary')}</Typography>
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'repeat(3, 1fr)',
                    },
                    gap: 1.5,
                }}
            >
                <SummaryTile
                    eyebrow={t('review.quantity')}
                    icon={<QuantityIcon fontSize="small" />}
                    accent="var(--accent)"
                    value={amountLabel}
                    sub={order.processNomenclatureName ?? '—'}
                />
                <SummaryTile
                    eyebrow={t('review.due')}
                    icon={<DueIcon fontSize="small" />}
                    accent={dueTone?.border ?? 'var(--line-strong)'}
                    value={
                        order.dueDate ? formatLocalDate(order.dueDate) : '—'
                    }
                    valueTone={dueTone?.fg}
                    chip={
                        dueStatus && dueTone
                            ? { label: dueStatus.label, tone: dueTone }
                            : undefined
                    }
                />
                <SummaryTile
                    eyebrow={t('review.plannedStart')}
                    icon={<StartIcon fontSize="small" />}
                    accent="var(--line-strong)"
                    value={
                        order.startDate
                            ? formatLocalDate(order.startDate)
                            : '—'
                    }
                    sub={
                        order.executor
                            ? t('review.operatorPrefix', {
                                  name: order.executor,
                              })
                            : t('review.unclaimed')
                    }
                />
            </Box>

            {order.description && (
                <Box>
                    <Typography sx={{ ...monoEyebrowSx, mb: 0.75 }}>
                        {t('review.notes')}
                    </Typography>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 1.5,
                            background: 'var(--surface)',
                            border: '1px solid var(--line)',
                            borderLeft: '3px solid var(--accent)',
                            borderRadius: 'var(--r-2)',
                            boxShadow: 'var(--elev-1)',
                            p: 1.75,
                        }}
                    >
                        <NotesIcon
                            sx={{
                                color: 'var(--accent)',
                                fontSize: 20,
                                flexShrink: 0,
                                mt: '2px',
                            }}
                        />
                        <Typography
                            sx={{
                                whiteSpace: 'pre-wrap',
                                color: 'var(--ink-1)',
                                fontSize: 14,
                                lineHeight: 1.55,
                            }}
                        >
                            {order.description}
                        </Typography>
                    </Box>
                </Box>
            )}

            <Footer>
                <MuiButton
                    variant="contained"
                    color={onResume ? 'primary' : 'success'}
                    size="large"
                    onClick={onResume ?? onNext}
                    startIcon={onResume ? undefined : <PlayIcon />}
                    sx={{
                        minWidth: 220,
                        fontWeight: 700,
                        py: 1.25,
                        textTransform: 'none',
                        fontSize: 15,
                    }}
                >
                    {onResume ? t('review.resume') : t('review.startRunning')}
                </MuiButton>
            </Footer>
        </Box>
    )
}

interface SummaryTileProps {
    eyebrow: string
    icon: React.ReactNode
    accent: string
    value: React.ReactNode
    valueTone?: string
    sub?: React.ReactNode
    chip?: { label: string; tone: Tone }
}

function SummaryTile({
    eyebrow,
    icon,
    accent,
    value,
    valueTone,
    sub,
    chip,
}: SummaryTileProps) {
    return (
        <Box
            sx={{
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                borderLeft: `3px solid ${accent}`,
                borderRadius: 'var(--r-2)',
                boxShadow: 'var(--elev-1)',
                p: 1.75,
                display: 'flex',
                flexDirection: 'column',
                gap: 0.5,
                minWidth: 0,
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                    color: accent,
                }}
            >
                {icon}
                <Typography sx={{ ...monoEyebrowSx, color: 'var(--ink-3)' }}>
                    {eyebrow}
                </Typography>
            </Box>
            <Typography
                className="num"
                sx={{
                    fontSize: 22,
                    fontWeight: 700,
                    lineHeight: 1.15,
                    letterSpacing: '-0.01em',
                    color: valueTone ?? 'var(--ink-1)',
                    wordBreak: 'break-word',
                }}
            >
                {value}
            </Typography>
            {chip && (
                <Chip
                    size="small"
                    label={chip.label}
                    sx={{
                        alignSelf: 'flex-start',
                        height: 22,
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        background: chip.tone.bg,
                        color: chip.tone.fg,
                        border: `1px solid ${chip.tone.border}`,
                        mt: 0.5,
                    }}
                />
            )}
            {sub && (
                <Typography
                    sx={{
                        fontSize: 12.5,
                        color: 'var(--ink-3)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        mt: 0.25,
                    }}
                >
                    {sub}
                </Typography>
            )}
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

const groupByGrade = (items: Item[], noGradeLabel: string): GradeBucket[] => {
    const map = new Map<string, GradeBucket>()
    for (const item of items) {
        const key = item.gradeId ?? '__none__'
        if (!map.has(key)) {
            map.set(key, {
                gradeId: item.gradeId ?? null,
                gradeName: item.gradeName ?? noGradeLabel,
                color: item.gradeId
                    ? colorForGradeId(item.gradeId)
                    : 'var(--surface-3)',
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

type TFn = (key: string, options?: Record<string, unknown>) => string

const computeDueStatus = (
    dueRaw: DateLike,
    completedRaw: DateLike | undefined,
    t: TFn,
): DueStatus | undefined => {
    const due = parseUtcDate(dueRaw)
    if (!due) return undefined
    const ref = parseUtcDate(completedRaw) ?? new Date()
    const dueDay = Date.UTC(due.getFullYear(), due.getMonth(), due.getDate())
    const refDay = Date.UTC(ref.getFullYear(), ref.getMonth(), ref.getDate())
    const diffDays = Math.round((refDay - dueDay) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return { kind: 'on-time', label: t('due.inTime') }
    if (diffDays > 0)
        return {
            kind: 'overdue',
            label: t('due.overdueDays', { count: diffDays }),
        }
    return {
        kind: 'ahead',
        label: t('due.aheadDays', { count: -diffDays }),
    }
}

const CompleteStep = ({
    order,
    unallocatedCount,
    outputs,
    onComplete,
    completing,
    completeError,
    isCompleted,
    readOnly,
    onBackToList,
}: CompleteStepProps) => {
    const { t } = useTranslation('desktop')
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

    const noGradeLabel = t('complete.noGrade')
    const gradeBuckets = useMemo(
        () =>
            groupByGrade(
                [
                    ...(outputs?.allocated ?? []),
                    ...(outputs?.unallocated ?? []),
                ],
                noGradeLabel,
            ),
        [outputs, noGradeLabel],
    )

    const dueStatus = useMemo(
        () => computeDueStatus(order.dueDate, order.completed, t),
        [order.dueDate, order.completed, t],
    )

    const dueTone = dueStatus ? DUE_TONE[dueStatus.kind] : undefined
    const tareSub =
        distinctTares > 0 && allocatedQty > 0
            ? t('complete.perTare', {
                  value: formatUnits(
                      Math.round(allocatedQty / distinctTares),
                      units,
                      countable,
                  ),
              })
            : undefined
    const outputsValue = isCompleted
        ? formatUnits(allocatedQty, units, countable)
        : `${formatUnits(allocatedQty, units, countable)} / ${formatUnits(totalQty, units, countable)}`

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                mt: 1,
                maxWidth: 980,
                width: '100%',
                mx: 'auto',
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    background: isCompleted
                        ? 'var(--sig-run-soft)'
                        : 'var(--surface)',
                    border: `1px solid ${isCompleted ? 'var(--sig-run-deep)' : 'var(--line)'}`,
                    borderLeft: '3px solid var(--sig-run-deep)',
                    borderRadius: 'var(--r-2)',
                    boxShadow: 'var(--elev-1)',
                    p: 2,
                }}
            >
                <Box
                    sx={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        background: isCompleted
                            ? 'var(--sig-run-deep)'
                            : 'var(--sig-run-soft)',
                        color: isCompleted ? '#fff' : 'var(--sig-run-deep)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}
                >
                    <CheckIcon sx={{ fontSize: 26 }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                        sx={{
                            fontSize: 20,
                            fontWeight: 700,
                            lineHeight: 1.2,
                            color: 'var(--sig-run-deep)',
                        }}
                    >
                        {isCompleted
                            ? t('complete.orderCompleted')
                            : t('complete.readyToComplete')}
                    </Typography>
                    <Typography
                        sx={{
                            mt: 0.25,
                            color: 'var(--ink-2)',
                            fontSize: 13.5,
                        }}
                    >
                        {isCompleted
                            ? t('complete.allOutputsAllocated', {
                                  count: distinctTares,
                              })
                            : t('complete.everyOutputAllocated')}
                    </Typography>
                </Box>
                {isCompleted && order.completed && (
                    <Box sx={{ flexShrink: 0, textAlign: 'right' }}>
                        <Typography
                            sx={{
                                ...monoEyebrowSx,
                                color: 'var(--ink-3)',
                            }}
                        >
                            {t('complete.completedAt')}
                        </Typography>
                        <Typography
                            sx={{
                                mt: 0.25,
                                fontFamily: 'var(--font-mono)',
                                fontSize: 14,
                                fontWeight: 700,
                                color: 'var(--ink-1)',
                            }}
                        >
                            {formatLocalDateTime(order.completed)}
                        </Typography>
                    </Box>
                )}
            </Box>

            <Typography sx={monoEyebrowSx}>{t('complete.outcome')}</Typography>
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'repeat(3, 1fr)',
                    },
                    gap: 1.5,
                }}
            >
                <SummaryTile
                    eyebrow={t('complete.outputs')}
                    icon={<QuantityIcon fontSize="small" />}
                    accent="var(--sig-run-deep)"
                    value={outputsValue}
                    sub={order.processNomenclatureName ?? undefined}
                />
                <SummaryTile
                    eyebrow={t('complete.taresUsed')}
                    icon={<TaresIcon fontSize="small" />}
                    accent="var(--ent-tare-deep)"
                    value={distinctTares}
                    sub={tareSub}
                />
                <SummaryTile
                    eyebrow={
                        isCompleted ? t('complete.due') : t('complete.dueBy')
                    }
                    icon={<DueIcon fontSize="small" />}
                    accent={dueTone?.border ?? 'var(--line-strong)'}
                    value={
                        order.dueDate ? formatLocalDate(order.dueDate) : '—'
                    }
                    valueTone={dueTone?.fg}
                    chip={
                        dueStatus && dueTone
                            ? { label: dueStatus.label, tone: dueTone }
                            : undefined
                    }
                />
            </Box>

            {gradeBuckets.length > 0 && (
                <Box>
                    <Typography sx={{ ...monoEyebrowSx, mb: 0.75 }}>
                        {t('complete.byGrade')}
                    </Typography>
                    <Box
                        sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 1,
                        }}
                    >
                        {gradeBuckets.map((g) => (
                            <Box
                                key={g.gradeId ?? 'no-grade'}
                                sx={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 0.75,
                                    px: 1.25,
                                    py: 0.5,
                                    background: 'var(--surface)',
                                    border: '1px solid var(--line)',
                                    borderRadius: 'var(--r-pill)',
                                    boxShadow: 'var(--elev-1)',
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 12,
                                        height: 12,
                                        borderRadius: '3px',
                                        background:
                                            g.color ?? 'var(--surface-3)',
                                        border: '1px solid rgba(0,0,0,0.15)',
                                        flexShrink: 0,
                                    }}
                                />
                                <Typography
                                    sx={{
                                        fontSize: 13,
                                        fontWeight: 600,
                                        color: 'var(--ink-1)',
                                    }}
                                >
                                    {g.gradeName}
                                </Typography>
                                <Box
                                    sx={{
                                        width: '1px',
                                        height: 12,
                                        background: 'var(--line)',
                                    }}
                                />
                                <Typography
                                    sx={{
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: 12.5,
                                        fontWeight: 700,
                                        color: 'var(--ink-2)',
                                    }}
                                >
                                    {formatUnits(g.quantity, units, countable)}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                </Box>
            )}

            {completeError && (
                <Alert severity="error">{completeError}</Alert>
            )}

            <Footer>
                {isCompleted ? (
                    <MuiButton
                        variant="contained"
                        color="primary"
                        size="large"
                        onClick={onBackToList}
                        sx={{
                            minWidth: 220,
                            fontWeight: 700,
                            py: 1.25,
                            textTransform: 'none',
                            fontSize: 15,
                        }}
                    >
                        {t('complete.backToList')}
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
                        startIcon={<CheckIcon />}
                        title={
                            readOnly
                                ? t('complete.readOnly')
                                : unallocatedCount > 0
                                  ? t('complete.allMustBeAllocated')
                                  : undefined
                        }
                        sx={{
                            minWidth: 220,
                            fontWeight: 700,
                            py: 1.25,
                            textTransform: 'none',
                            fontSize: 15,
                        }}
                    >
                        {readOnly
                            ? t('complete.readOnly')
                            : completing
                              ? t('complete.completing')
                              : t('complete.completeOrder')}
                    </MuiButton>
                )}
            </Footer>
        </Box>
    )
}
