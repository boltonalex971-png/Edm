import api from '@features/api/api.ts'
import { LaunchStep } from '@logistics/components/desktop/LaunchStep'
import styles from '@logistics/components/desktop/desktop.module.css'
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
import {
    type DateLike,
    formatLocalDate,
    formatLocalDateTime,
    formatUnits,
    parseUtcDate,
} from '@logistics/utils/format'
import { colorForGradeId } from '@logistics/utils/gradePalette'
import axios from 'axios'
import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import type { RootState } from '@logistics/store'

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

    const [[order], loading] = useGet<Order>(id ? `${api.orders}/${id}` : '', [id, orderToken])
    const [[outputs]] = useGet<OrderOutputItems>(
        id ? `${api.orders}/${id}/output-items` : '',
        [id, orderToken],
    )

    // Claim the order for as long as the operator stays in this view, so
    // other tabs/users see "Executing by {username}" the same way they
    // see a persisted Executor banner. Nothing happens once the order
    // already has a persisted executor: that's already the source of
    // truth and gating happens through the existing isReadOnly path.
    const username = useSelector((s: RootState) => s.user.name)
    const claim = useOrderClaimState(id)
    const claimedByOther = !!claim.lockedBy && !claim.isOwn
    const claimable =
        !!id && !!order && order.status !== 'Completed' && !order.executor
    useAcquireOrderClaim(id, claimable, username)

    const occupiedBy = order?.executor || (claimedByOther ? claim.lockedBy : null)
    const isReadOnly =
        (!!order?.executor && order.mine === false) || claimedByOther
    const isAlreadyLaunched = !!order && order.status !== 'Draft'
    const isCompleted = order?.status === 'Completed'
    const unallocatedCount = outputs?.unallocated?.length ?? 0
    const allocatedCount = outputs?.allocated?.length ?? 0
    // All produced outputs have been placed in tares — Done becomes
    // reachable even before the operator clicks "Complete order".
    const allAllocated =
        isAlreadyLaunched && allocatedCount + unallocatedCount > 0 && unallocatedCount === 0

    // The step that reflects the order's *current* execution state on the
    // server. Stepper navigation is allowed up to and including this step.
    const liveStep: Step = useMemo(() => {
        if (!order) return 'review'
        if (isCompleted || allAllocated) return 'complete'
        if (isAlreadyLaunched) return 'distribute'
        return 'review'
    }, [order, isAlreadyLaunched, isCompleted, allAllocated])

    // Track the highest step the user has reached this session so they can
    // step backward and forward freely without losing their place.
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
                    e.response?.data?.detail || e.response?.statusText || 'Failed to launch',
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

    const renderReviewBanner = () => {
        if (!isOnPastStep) return null
        const liveLabel =
            liveStep === 'distribute'
                ? 'Distribute'
                : liveStep === 'complete'
                  ? 'Done'
                  : 'Launch'
        return (
            <div className={styles.reviewBanner}>
                <span>
                    Reviewing — order is currently at <strong>{liveLabel}</strong>.
                </span>
                <button type="button" className={styles.resumeBtn} onClick={() => setStep(liveStep)}>
                    Resume
                </button>
            </div>
        )
    }

    return (
        <div className={styles.runRoot}>
            <div className={styles.runHeader}>
                <button type="button" className={styles.backBtn} onClick={backToList}>
                    ← Back
                </button>
                <div className={styles.runTitle}>
                    {order?.processName || (loading ? 'Loading…' : 'Order')}
                </div>
                {order?.processNomenclatureName && (
                    <div className={styles.runHeaderMeta}>
                        {order.processNomenclatureName} · {order.amount} pcs
                    </div>
                )}
            </div>

            {isReadOnly && (
                <div className={styles.readonlyBanner}>
                    {order?.executor ? 'Executed' : 'Executing'} by{' '}
                    <strong>{occupiedBy}</strong> — read-only. You can view
                    progress but cannot change anything.
                </div>
            )}

            <div className={styles.stepper}>
                {STEPS.map((s, idx) => {
                    const reachable = idx <= maxStepIndex
                    const isLive = idx === maxStepIndex
                    const isDone = idx < maxStepIndex
                    const isViewing = idx === activeStepIndex
                    const cls = [
                        styles.step,
                        isLive && styles.stepActive,
                        isDone && styles.stepDone,
                        isViewing && styles.stepViewing,
                        reachable ? styles.stepClickable : styles.stepDisabled,
                    ]
                        .filter(Boolean)
                        .join(' ')
                    return (
                        <button
                            key={s.id}
                            type="button"
                            className={cls}
                            disabled={!reachable}
                            onClick={() => tryGoToStep(s.id)}
                        >
                            {idx + 1}. {s.label}
                        </button>
                    )
                })}
            </div>

            {renderReviewBanner()}

            <div className={styles.runBody}>
                {step === 'review' && order && (
                    <ReviewStep
                        order={order}
                        onNext={() => setStep('launch')}
                        nextLabel={isOnPastStep ? 'Continue review' : 'Next'}
                        onResume={isOnPastStep ? () => setStep(liveStep) : undefined}
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
                        onResume={isOnPastStep ? () => setStep(liveStep) : undefined}
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
            </div>
        </div>
    )
}

type ReviewStepProps = {
    order: Order
    onNext: () => void
    nextLabel: string
    onResume?: () => void
}

const ReviewStep = ({ order, onNext, nextLabel, onResume }: ReviewStepProps) => (
    <div>
        <div className={styles.reviewGrid}>
            <div className={styles.reviewLabel}>Process</div>
            <div className={styles.reviewValue}>{order.processName}</div>
            <div className={styles.reviewLabel}>Nomenclature</div>
            <div className={styles.reviewValue}>{order.processNomenclatureName ?? '—'}</div>
            <div className={styles.reviewLabel}>Amount</div>
            <div className={styles.reviewValue}>
                {formatUnits(
                    order.amount,
                    order.processNomenclatureUnits,
                    order.processNomenclatureCountable,
                )}
            </div>
            {order.startDate && (
                <>
                    <div className={styles.reviewLabel}>Start</div>
                    <div className={styles.reviewValue}>
                        {formatLocalDate(order.startDate)}
                    </div>
                </>
            )}
            {order.dueDate && (
                <>
                    <div className={styles.reviewLabel}>Due</div>
                    <div className={styles.reviewValue}>
                        {formatLocalDate(order.dueDate)}
                    </div>
                </>
            )}
            {order.description && (
                <>
                    <div className={styles.reviewLabel}>Description</div>
                    <div className={styles.reviewValue}>{order.description}</div>
                </>
            )}
        </div>

        <div className={styles.footer}>
            <button
                type="button"
                className={styles.primary}
                onClick={onResume ?? onNext}
            >
                {onResume ? 'Resume' : nextLabel}
            </button>
        </div>
    </div>
)

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
                color: item.gradeId ? colorForGradeId(item.gradeId) : '#e3f2fd',
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

/** Calendar-day comparison: same day = "In time"; later days = overdue;
 *  earlier days = before plan. Time-of-day is ignored. */
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
    if (diffDays === 0) {
        return { kind: 'on-time', label: 'In time' }
    }
    if (diffDays > 0) {
        return { kind: 'overdue', label: `Overdue ${diffDays} d` }
    }
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
    const totalOutputs = allocatedCount + unallocatedCount
    const distinctTares = useMemo(() => {
        const ids = new Set<string>()
        for (const item of outputs?.allocated ?? []) {
            if (item.tareId) ids.add(item.tareId)
        }
        return ids.size
    }, [outputs])

    const allocatedQty = useMemo(
        () => (outputs?.allocated ?? []).reduce((s, i) => s + (i.quantity ?? 0), 0),
        [outputs],
    )
    const totalQty = useMemo(
        () =>
            allocatedQty +
            (outputs?.unallocated ?? []).reduce((s, i) => s + (i.quantity ?? 0), 0),
        [allocatedQty, outputs],
    )
    const units = order.processNomenclatureUnits
    const countable = order.processNomenclatureCountable

    const gradeBuckets = useMemo(
        () => groupByGrade([...(outputs?.allocated ?? []), ...(outputs?.unallocated ?? [])]),
        [outputs],
    )

    const dueStatus = useMemo(
        () => computeDueStatus(order.dueDate, order.completed),
        [order.dueDate, order.completed],
    )
    const dueBadgeClass = !dueStatus
        ? ''
        : dueStatus.kind === 'on-time'
          ? `${styles.dueBadge} ${styles.dueOnTime}`
          : dueStatus.kind === 'overdue'
            ? `${styles.dueBadge} ${styles.dueOverdue}`
            : `${styles.dueBadge} ${styles.dueAhead}`

    return (
        <div className={styles.doneCard}>
            <div className={styles.doneHeadline}>
                {isCompleted ? 'Order completed' : 'Ready to complete'}
            </div>
            <div className={styles.doneSubline}>
                {isCompleted
                    ? `All done.`
                    : `Every output is allocated. Confirm to close the order.`}
            </div>

            <div className={styles.doneStats}>
                <div className={styles.doneStatLabel}>Nomenclature</div>
                <div className={styles.doneStatValue}>
                    {order.processNomenclatureName ?? '—'}
                </div>
                <div className={styles.doneStatLabel}>Amount</div>
                <div className={styles.doneStatValue}>
                    {formatUnits(order.amount, units, countable)}
                </div>
                <div className={styles.doneStatLabel}>Outputs allocated</div>
                <div className={styles.doneStatValue}>
                    {formatUnits(allocatedQty, units, countable)} /{' '}
                    {formatUnits(totalQty, units, countable)}
                </div>
                <div className={styles.doneStatLabel}>Tares used</div>
                <div className={styles.doneStatValue}>{distinctTares}</div>
                {order.executor && (
                    <>
                        <div className={styles.doneStatLabel}>Executor</div>
                        <div className={styles.doneStatValue}>{order.executor}</div>
                    </>
                )}
                {order.dueDate && (
                    <>
                        <div className={styles.doneStatLabel}>Due</div>
                        <div className={styles.doneStatValue}>
                            <span style={{ marginRight: '0.5rem' }}>
                                {formatLocalDate(order.dueDate)}
                            </span>
                            {dueStatus && (
                                <span className={dueBadgeClass}>
                                    {dueStatus.label}
                                </span>
                            )}
                        </div>
                    </>
                )}
                {order.completed && (
                    <>
                        <div className={styles.doneStatLabel}>Completed</div>
                        <div className={styles.doneStatValue}>
                            {formatLocalDateTime(order.completed)}
                        </div>
                    </>
                )}
            </div>

            {gradeBuckets.length > 0 && (
                <div className={styles.doneSection}>
                    <div className={styles.doneSectionTitle}>By grade</div>
                    <div className={styles.gradeRows}>
                        {gradeBuckets.map((g) => (
                            <div
                                key={g.gradeId ?? 'no-grade'}
                                className={styles.gradeRow}
                            >
                                <span
                                    className={styles.gradeSwatch}
                                    style={{ background: g.color ?? '#eee' }}
                                />
                                <span className={styles.gradeName}>
                                    {g.gradeName}
                                </span>
                                <span className={styles.gradeCount}>
                                    {formatUnits(g.quantity, units, countable)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {completeError && (
                <div className={styles.errorMsg} style={{ marginTop: '0.6rem' }}>
                    {completeError}
                </div>
            )}

            <div className={styles.doneFooter}>
                {isCompleted ? (
                    <button type="button" className={styles.primary} onClick={onBackToList}>
                        Back to list
                    </button>
                ) : (
                    <button
                        type="button"
                        className={`${styles.primary} ${styles.success}`}
                        onClick={onComplete}
                        disabled={readOnly || completing || unallocatedCount > 0}
                        title={
                            readOnly
                                ? 'Read-only'
                                : unallocatedCount > 0
                                  ? 'All outputs must be allocated before completing'
                                  : undefined
                        }
                    >
                        {readOnly
                            ? 'Read-only'
                            : completing
                              ? 'Completing…'
                              : 'Complete order'}
                    </button>
                )}
            </div>
        </div>
    )
}
