import Api from '@features/api/api'
import { Loading } from '@features/utils/Utils'
import { ItemDetail } from '@logistics/components/items/ItemDetail'
import { TareDetail } from '@logistics/components/tare/TareDetail'
import {
    groupByTare,
    tareSummary,
} from '@logistics/components/tare/TareItemsPanel'
import {
    type SlotData,
    TareSchematic,
} from '@logistics/components/tare/TareSchematic'
import type { Item, Order, OrderOutputItems, UUID } from '@logistics/data/types'
import { useGet } from '@logistics/hooks/hooks'
import { Button } from '@progress/kendo-react-buttons'
import React, { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight } from 'react-bootstrap-icons'
import { useNavigate } from 'react-router-dom'
import { Alert } from 'reactstrap'
import '@logistics/components/tare/TareItemsPanel.css'

type OrderOutputTabProps = {
    id: UUID
    api: string
    order?: Order
    onDetailSelected?: Function
}

export function OrderOutputTab({
    id,
    api,
    order,
    onDetailSelected,
}: OrderOutputTabProps) {
    const navigate = useNavigate()
    const [[data], loading, error] = useGet<OrderOutputItems>(
        `${api}/${id}/output-items`,
        [id],
    )
    const [expanded, setExpanded] = useState<Set<string>>(new Set())

    const allocatedGroups = useMemo(
        () => groupByTare(data?.allocated ?? []),
        [data],
    )
    const unallocated: Item[] = data?.unallocated ?? []

    const isCompleted = !!order?.completed
    const isDeleted = !!order?.deleted
    const allAllocated = !loading && unallocated.length === 0
    const allocateDisabled = allAllocated || isCompleted || isDeleted
    const allocateDisabledReason = isDeleted
        ? 'Order is deleted'
        : isCompleted
          ? 'Order is completed'
          : allAllocated
            ? 'All outputs are already allocated'
            : undefined

    const toggleExpand = (key: string) => {
        setExpanded((prev) => {
            const next = new Set(prev)
            if (next.has(key)) {
                next.delete(key)
            } else {
                next.add(key)
            }
            return next
        })
    }

    const openItem = (item: Item) => {
        onDetailSelected?.(
            <ItemDetail
                readonly={true}
                id={item.id}
                api={Api.items}
                onClose={() => onDetailSelected?.(undefined)}
            />,
        )
    }

    return (
        <div>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    marginBottom: '0.5rem',
                }}
            >
                <Button
                    themeColor="primary"
                    disabled={allocateDisabled}
                    title={allocateDisabledReason}
                    onClick={() => navigate(`/orders/allocate-output/${id}`)}
                >
                    Allocate output
                </Button>
            </div>

            {error && <Alert color="danger">{error}</Alert>}
            {loading && <Loading />}

            {!loading && (
                <>
                    <h5 style={{ marginTop: 0, marginBottom: '0.5rem' }}>
                        Allocated
                    </h5>
                    {allocatedGroups.length === 0 ? (
                        <div
                            style={{
                                color: '#999',
                                fontStyle: 'italic',
                                marginBottom: '1rem',
                            }}
                        >
                            No allocated outputs yet
                        </div>
                    ) : (
                        <div
                            className="tare-items-panel"
                            style={{ marginBottom: '1rem' }}
                        >
                            {allocatedGroups.map((group) => {
                                const key = group.tare.id || 'no-tare'
                                const isOpen = expanded.has(key)
                                return (
                                    <div key={key} className="tare-row-group">
                                        <div
                                            className="tare-row"
                                            onClick={() =>
                                                onDetailSelected?.(
                                                    <TareDetail
                                                        tareId={group.tare.id}
                                                        label={
                                                            group.tare.barcode
                                                        }
                                                        onClose={() =>
                                                            onDetailSelected?.(
                                                                undefined,
                                                            )
                                                        }
                                                    />,
                                                )
                                            }
                                        >
                                            <button
                                                type="button"
                                                className="tare-expand-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    toggleExpand(key)
                                                }}
                                            >
                                                {isOpen ? (
                                                    <ChevronDown size={14} />
                                                ) : (
                                                    <ChevronRight size={14} />
                                                )}
                                            </button>
                                            <span className="tare-row-barcode">
                                                {group.tare.barcode ||
                                                    '(no barcode)'}
                                            </span>
                                            <span className="tare-row-type">
                                                {group.tare.tareTypeName}
                                            </span>
                                            <span className="tare-row-nomenclatures">
                                                {[
                                                    ...new Set(
                                                        group.items.map(
                                                            (i) =>
                                                                i.nomenclatureName,
                                                        ),
                                                    ),
                                                ].join(', ')}
                                            </span>
                                            <span className="tare-row-summary">
                                                {tareSummary(group)}
                                            </span>
                                            {group.tare.tareTypeUnits && (
                                                <span className="tare-row-units">
                                                    {group.tare.tareTypeUnits}
                                                </span>
                                            )}
                                        </div>
                                        {isOpen && (
                                            <div className="tare-row-detail">
                                                <TareSchematic
                                                    tare={group.tare}
                                                    items={group.items}
                                                    onSlotClick={(
                                                        slot: SlotData,
                                                    ) => {
                                                        if (slot.item) {
                                                            openItem(slot.item)
                                                        }
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    <h5 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>
                        Unallocated
                    </h5>
                    {unallocated.length === 0 ? (
                        <div style={{ color: '#999', fontStyle: 'italic' }}>
                            No unallocated outputs
                        </div>
                    ) : (
                        <table
                            className="k-table k-table-md"
                            style={{ width: '100%' }}
                        >
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'left' }}>
                                        Nomenclature
                                    </th>
                                    <th
                                        style={{
                                            textAlign: 'right',
                                            width: 120,
                                        }}
                                    >
                                        Quantity
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {unallocated.map((item) => (
                                    <tr
                                        key={item.id}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => openItem(item)}
                                    >
                                        <td>{item.nomenclatureName}</td>
                                        <td style={{ textAlign: 'right' }}>
                                            {item.quantity}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </>
            )}
        </div>
    )
}
