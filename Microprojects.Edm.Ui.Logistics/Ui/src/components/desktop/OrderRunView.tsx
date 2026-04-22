import api from '@features/api/api.ts'
import { LaunchStep } from '@logistics/components/desktop/LaunchStep'
import styles from '@logistics/components/desktop/desktop.module.css'
import { AllocateProcessOutput } from '@logistics/components/orders/AllocateProcessOutput'
import type {
    ExecuteResult,
    Order,
    OrderOutputItems,
    UUID,
} from '@logistics/data/types'
import { useGet } from '@logistics/hooks/hooks'
import axios from 'axios'
import { useEffect, useMemo, useState } from 'react'
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

    const [reloadToken, setReloadToken] = useState(0)
    const [launching, setLaunching] = useState(false)
    const [launchError, setLaunchError] = useState<string | undefined>()
    const [step, setStep] = useState<Step>('review')

    const [[order], loading] = useGet<Order>(id ? `${api.orders}/${id}` : '', [
        id,
        reloadToken,
    ])
    const [[outputs]] = useGet<OrderOutputItems>(
        id ? `${api.orders}/${id}/output-items` : '',
        [id, reloadToken],
    )

    const isReadOnly = !!order?.executor && order.mine === false
    const isAlreadyLaunched = !!order && order.status !== 'Draft'
    const isCompleted = order?.status === 'Completed'

    // The step that reflects the order's *current* execution state on the
    // server. Stepper navigation is allowed up to and including this step.
    const liveStep: Step = useMemo(() => {
        if (!order) return 'review'
        if (isCompleted) return 'complete'
        if (isAlreadyLaunched) return 'distribute'
        return 'review'
    }, [order, isAlreadyLaunched, isCompleted])

    // Track the highest step the user has reached this session so they can
    // step backward and forward freely without losing their place.
    const [maxStep, setMaxStep] = useState<Step>('review')

    useEffect(() => {
        // Bump max-step whenever the live state advances or the user clicks
        // forward in the stepper.
        if (stepIndex(liveStep) > stepIndex(maxStep)) {
            setMaxStep(liveStep)
        }
    }, [liveStep, maxStep])

    useEffect(() => {
        if (stepIndex(step) > stepIndex(maxStep)) {
            setMaxStep(step)
        }
    }, [step, maxStep])

    // Initial step decision.
    useEffect(() => {
        if (!order) return
        setStep(liveStep)
    }, [order, liveStep])

    const activeStepIndex = stepIndex(step)
    const liveStepIndex = stepIndex(liveStep)
    const maxStepIndex = stepIndex(maxStep)

    const isOnPastStep = activeStepIndex < liveStepIndex
    const isOnFutureStep = activeStepIndex > liveStepIndex

    const launch = () => {
        if (!id || isReadOnly) return
        setLaunchError(undefined)
        setLaunching(true)
        axios
            .post<ExecuteResult>(`${api.orders}/${id}/execute`)
            .then((r) => {
                setReloadToken((x) => x + 1)
                if (r.data.completed) {
                    setStep('complete')
                } else {
                    setStep('distribute')
                }
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

    const onOutputsChanged = () => {
        setReloadToken((x) => x + 1)
    }

    const backToList = () => navigate('/desktop')

    const tryGoToStep = (target: Step) => {
        if (stepIndex(target) <= maxStepIndex) {
            setStep(target)
        }
    }

    const renderReviewBanner = () => {
        if (!isOnPastStep) return null
        return (
            <div className={styles.reviewBanner}>
                <span>
                    Reviewing — order is currently at <strong>{liveStep === 'distribute' ? 'Distribute' : liveStep === 'complete' ? 'Done' : 'Launch'}</strong>.
                </span>
                <button
                    type="button"
                    className={styles.resumeBtn}
                    onClick={() => setStep(liveStep)}
                >
                    Resume
                </button>
            </div>
        )
    }

    return (
        <div className={styles.runRoot}>
            <div className={styles.runHeader}>
                <button
                    type="button"
                    className={styles.backBtn}
                    onClick={backToList}
                >
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
                    Executed by <strong>{order?.executor}</strong> — read-only.
                    You can view progress but cannot change anything.
                </div>
            )}

            <div className={styles.stepper}>
                {STEPS.map((s, idx) => {
                    const reachable = idx <= maxStepIndex
                    // Frontier (the live execution state) is always blue — it
                    // marks where the order actually sits, independently of
                    // where the user is currently looking.
                    const isLive = idx === maxStepIndex
                    // Earlier reached steps are always green (done).
                    const isDone = idx < maxStepIndex
                    // Currently-viewed step: explicit outline so the user
                    // always sees which step they're looking at.
                    const isViewing = idx === activeStepIndex
                    const cls = [
                        styles.step,
                        isLive && styles.stepActive,
                        isDone && styles.stepDone,
                        isViewing && styles.stepViewing,
                        reachable
                            ? styles.stepClickable
                            : styles.stepDisabled,
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
                        nextLabel={
                            isOnPastStep ? 'Continue review' : 'Next'
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
                        // Lock the step only when execution has already moved
                        // past it. Going forward from Review on a Draft order
                        // is the legitimate path to allocate inputs and launch.
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
                            if (
                                (outputs?.unallocated?.length ?? 0) === 0 &&
                                order?.status === 'Completed'
                            ) {
                                setStep('complete')
                            } else {
                                backToList()
                            }
                        }}
                    />
                )}
                {step === 'complete' && (
                    <div className={styles.completeHero}>
                        <div className={styles.completeTitle}>
                            {isCompleted ? 'Order completed' : 'Done'}
                        </div>
                        <div className={styles.completeSub}>
                            {order?.processName} — all outputs allocated.
                        </div>
                        <div style={{ marginTop: '1.5rem' }}>
                            <button
                                type="button"
                                className={styles.primary}
                                onClick={backToList}
                            >
                                Back to list
                            </button>
                        </div>
                    </div>
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

const ReviewStep = ({ order, onNext, nextLabel, onResume }: ReviewStepProps) => {
    return (
        <div>
            <div className={styles.reviewGrid}>
                <div className={styles.reviewLabel}>Process</div>
                <div className={styles.reviewValue}>{order.processName}</div>
                <div className={styles.reviewLabel}>Nomenclature</div>
                <div className={styles.reviewValue}>
                    {order.processNomenclatureName ?? '—'}
                </div>
                <div className={styles.reviewLabel}>Amount</div>
                <div className={styles.reviewValue}>{order.amount} pcs</div>
                {order.startDate && (
                    <>
                        <div className={styles.reviewLabel}>Start</div>
                        <div className={styles.reviewValue}>
                            {new Date(order.startDate).toLocaleDateString()}
                        </div>
                    </>
                )}
                {order.dueDate && (
                    <>
                        <div className={styles.reviewLabel}>Due</div>
                        <div className={styles.reviewValue}>
                            {new Date(order.dueDate).toLocaleDateString()}
                        </div>
                    </>
                )}
                {order.description && (
                    <>
                        <div className={styles.reviewLabel}>Description</div>
                        <div className={styles.reviewValue}>
                            {order.description}
                        </div>
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
}
