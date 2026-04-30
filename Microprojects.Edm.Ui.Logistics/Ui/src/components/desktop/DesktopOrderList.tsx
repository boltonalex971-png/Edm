import api from '@features/api/api.ts'
import styles from '@logistics/components/desktop/desktop.module.css'
import type { Order, OrderStatus, UUID } from '@logistics/data/types'
import { usePost } from '@logistics/hooks/hooks'
import { formatLocalDate, parseUtcDate } from '@logistics/utils/format'
import { useMemo } from 'react'

type DesktopOrderListProps = {
    onOpen: (id: UUID, mine: boolean, lockedByOther: boolean) => void
}

const statusLabel = (status?: OrderStatus) => {
    switch (status) {
        case 'Running':
            return 'Running'
        case 'OutputsPending':
            return 'Outputs pending'
        case 'Completed':
            return 'Completed'
        default:
            return 'Draft'
    }
}

const statusClass = (status?: OrderStatus) => {
    switch (status) {
        case 'Running':
            return `${styles.statusBadge} ${styles.statusBadgeRunning}`
        case 'OutputsPending':
            return `${styles.statusBadge} ${styles.statusBadgePending}`
        case 'Completed':
            return `${styles.statusBadge} ${styles.statusBadgeDone}`
        default:
            return `${styles.statusBadge} ${styles.statusBadgeDraft}`
    }
}

const isOverdue = (dueDate: Order['dueDate']) => {
    const due = parseUtcDate(dueDate)
    if (!due) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return due.getTime() <= today.getTime() + 24 * 60 * 60 * 1000
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
            if (order.mine) {
                mine.push(order)
            } else {
                available.push(order)
            }
        }
        // Most recently-launched first for "mine"; due-soonest first for available.
        mine.sort((a, b) => (a.status ?? '').localeCompare(b.status ?? ''))
        available.sort((a, b) => {
            const ad = parseUtcDate(a.dueDate)?.getTime() ?? Number.POSITIVE_INFINITY
            const bd = parseUtcDate(b.dueDate)?.getTime() ?? Number.POSITIVE_INFINITY
            return ad - bd
        })
        return { mine, available }
    }, [orders])

    const renderCard = (
        order: Order,
        variant: 'mine' | 'available' | 'locked',
    ) => {
        const cardClass =
            variant === 'mine'
                ? `${styles.card} ${styles.cardMine}`
                : variant === 'locked'
                  ? `${styles.card} ${styles.cardLocked}`
                  : `${styles.card} ${styles.cardAvailable}`

        const overdueClass = isOverdue(order.dueDate) ? styles.cardOverdue : ''

        return (
            <div
                key={order.id}
                className={`${cardClass} ${overdueClass}`}
                onClick={() =>
                    onOpen(order.id, !!order.mine, variant === 'locked')
                }
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onOpen(order.id, !!order.mine, variant === 'locked')
                    }
                }}
                role="button"
                tabIndex={0}
            >
                <div className={styles.cardTitle}>
                    {order.number ? `#${order.number} · ` : ''}
                    {order.processName || '—'}
                </div>
                {order.processNomenclatureName && (
                    <div className={styles.cardSub}>
                        {order.processNomenclatureName}
                    </div>
                )}
                <div className={styles.cardRow}>
                    <span>{order.amount} pcs</span>
                    {order.dueDate && (
                        <span className={styles.cardMeta}>
                            Due {formatLocalDate(order.dueDate)}
                        </span>
                    )}
                </div>
                <div className={styles.cardRow}>
                    <span className={statusClass(order.status)}>
                        {statusLabel(order.status)}
                    </span>
                    {order.executor && (
                        <span className={styles.cardMeta}>
                            {variant === 'mine' ? 'You' : order.executor}
                        </span>
                    )}
                </div>
                {variant === 'locked' ? (
                    <div className={styles.cardLockedLabel}>
                        Executed by{' '}
                        <strong>{order.executor || 'another operator'}</strong>{' '}
                        · view only
                    </div>
                ) : (
                    <button
                        type="button"
                        className={`${styles.cardAction} ${variant === 'mine' ? styles.cardActionMine : ''}`}
                        onClick={(e) => {
                            e.stopPropagation()
                            onOpen(order.id, !!order.mine, false)
                        }}
                    >
                        {variant === 'mine' ? 'Continue' : 'Open'}
                    </button>
                )}
            </div>
        )
    }

    return (
        <div>
            {error && (
                <div style={{ color: '#d32f2f', marginBottom: '0.8rem' }}>
                    {typeof error === 'string'
                        ? error
                        : 'Failed to load orders'}
                </div>
            )}

            {mine.length > 0 && (
                <>
                    <h2 className={styles.sectionTitle}>My pending orders</h2>
                    <div className={styles.cardGrid}>
                        {mine.map((o) => renderCard(o, 'mine'))}
                    </div>
                </>
            )}

            <h2 className={styles.sectionTitle}>Available orders</h2>
            {loading && available.length === 0 && (
                <div className={styles.sectionEmpty}>Loading...</div>
            )}
            {!loading && available.length === 0 && (
                <div className={styles.sectionEmpty}>
                    No orders are available to start right now.
                </div>
            )}
            {available.length > 0 && (
                <div className={styles.cardGrid}>
                    {available.map((o) =>
                        renderCard(o, o.executor ? 'locked' : 'available'),
                    )}
                </div>
            )}
        </div>
    )
}
