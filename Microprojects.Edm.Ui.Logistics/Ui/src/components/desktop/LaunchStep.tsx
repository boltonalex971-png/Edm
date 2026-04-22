import api from '@features/api/api.ts'
import { ComponentLookup } from '@logistics/components/desktop/ComponentLookup'
import styles from '@logistics/components/desktop/desktop.module.css'
import type {
    AllocateItemsResult,
    OrderSpecification,
    UUID,
} from '@logistics/data/types'
import { getData } from '@logistics/hooks/hooks'
import { useCallback, useEffect, useState } from 'react'

type LaunchStepProps = {
    orderId: UUID
    onLaunch: () => void
    launching: boolean
    launchError?: string
    readOnly: boolean
    /** When true the order is no longer at the Launch step — hide Launch and
     * the lookup affordance; show inputs as a read-only summary. */
    reviewOnly?: boolean
    /** Provided when reviewOnly: button to return to the live step. */
    onResume?: () => void
}

const EPS = 1e-9

export const LaunchStep = ({
    orderId,
    onLaunch,
    launching,
    launchError,
    readOnly,
    reviewOnly,
    onResume,
}: LaunchStepProps) => {
    const locked = readOnly || reviewOnly === true

    const [specs, setSpecs] = useState<OrderSpecification[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | undefined>()
    const [info, setInfo] = useState<string | undefined>()
    const [pickFor, setPickFor] = useState<OrderSpecification | undefined>()

    const reload = useCallback(async () => {
        setError(undefined)
        try {
            const data = await getData<OrderSpecification[]>(
                `${api.orders}/${orderId}/specification`,
            )
            setSpecs(data ?? [])
        } catch (e) {
            setError(
                (e as { message?: string })?.message ||
                    'Failed to load specifications',
            )
        } finally {
            setLoading(false)
        }
    }, [orderId])

    useEffect(() => {
        void reload()
    }, [reload])

    const onAllocated = (result?: AllocateItemsResult) => {
        if (result) {
            setInfo(
                `Added ${result.allocatedCount} item(s)` +
                    (result.stoppedReason
                        ? ` (stopped: ${result.stoppedReason})`
                        : ''),
            )
        }
        void reload()
    }

    const allComplete =
        specs.length > 0 && specs.every((s) => s.total + EPS >= s.amount)
    const launchDisabled = locked || launching || !allComplete

    return (
        <div>
            {!locked && specs.length > 0 && (
                <div className={styles.specHint}>
                    {info ??
                        'Click a row to pick available items for that nomenclature.'}
                </div>
            )}

            {error && <div className={styles.errorMsg}>{error}</div>}

            {loading && <div className={styles.sectionEmpty}>Loading…</div>}
            {!loading && specs.length === 0 && (
                <div className={styles.sectionEmpty}>
                    No input specifications for this process — ready to launch.
                </div>
            )}
            {specs.length > 0 && (
                <table className={styles.specGrid}>
                    <thead>
                        <tr>
                            <th>Nomenclature</th>
                            <th>Required</th>
                            <th>Allocated</th>
                        </tr>
                    </thead>
                    <tbody>
                        {specs.map((spec) => {
                            const ok = spec.total + EPS >= spec.amount
                            const clickable = !locked && !ok
                            return (
                                <tr
                                    key={spec.id}
                                    className={`${ok ? styles.specRowOk : ''} ${clickable ? styles.specRowClickable : ''}`}
                                    onClick={
                                        clickable
                                            ? () => setPickFor(spec)
                                            : undefined
                                    }
                                    title={
                                        clickable
                                            ? 'Click to pick items'
                                            : undefined
                                    }
                                >
                                    <td>
                                        <div style={{ fontWeight: 500 }}>
                                            {spec.nomenclatureName ?? '—'}
                                        </div>
                                        {spec.nomenclatureCategory && (
                                            <div
                                                style={{
                                                    fontSize: '0.8rem',
                                                    color: '#888',
                                                }}
                                            >
                                                {spec.nomenclatureCategory}
                                            </div>
                                        )}
                                    </td>
                                    <td>{spec.amount}</td>
                                    <td>
                                        <span
                                            className={`${styles.specProgress} ${ok ? styles.specProgressOk : styles.specProgressShort}`}
                                        >
                                            {spec.total} / {spec.amount}
                                        </span>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            )}

            {launchError && <div className={styles.errorMsg}>{launchError}</div>}

            <div className={styles.footer}>
                {reviewOnly && onResume ? (
                    <button
                        type="button"
                        className={styles.primary}
                        onClick={onResume}
                    >
                        Resume
                    </button>
                ) : (
                    <button
                        type="button"
                        className={styles.primary}
                        onClick={onLaunch}
                        disabled={launchDisabled}
                        title={
                            readOnly
                                ? 'Read-only'
                                : !allComplete
                                  ? 'All inputs must be allocated before launch'
                                  : undefined
                        }
                    >
                        {readOnly
                            ? 'Read-only'
                            : launching
                              ? 'Launching…'
                              : 'Launch'}
                    </button>
                )}
            </div>

            {pickFor && (
                <ComponentLookup
                    orderId={orderId}
                    spec={pickFor}
                    onClose={() => setPickFor(undefined)}
                    onAllocated={onAllocated}
                />
            )}
        </div>
    )
}
