import Api from '@features/api/api'
import { Loading } from '@features/utils/Utils'
import { ItemDetail } from '@logistics/components/items/ItemDetail'
import { OutputItemsPanel } from '@logistics/components/orders/OutputItemsPanel'
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
import React, { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight } from 'react-bootstrap-icons'
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
    onDetailSelected,
}: OrderOutputTabProps) {
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
            {error && <Alert color="danger">{error}</Alert>}
            {loading && <Loading />}

            {!loading &&
                allocatedGroups.length === 0 &&
                unallocated.length === 0 && (
                    <div className="tare-items-empty">Not executed yet</div>
                )}

            {!loading && (
                <>
                    {allocatedGroups.length > 0 && (
                        <>
                            <h5
                                style={{ marginTop: 0, marginBottom: '0.5rem' }}
                            >
                                Allocated
                            </h5>
                            <div
                                className="tare-items-panel"
                                style={{ marginBottom: '1rem' }}
                            >
                                {allocatedGroups.map((group) => {
                                    const key = group.tare.id || 'no-tare'
                                    const isOpen = expanded.has(key)
                                    return (
                                        <div
                                            key={key}
                                            className="tare-row-group"
                                        >
                                            <div
                                                className="tare-row"
                                                onClick={() =>
                                                    onDetailSelected?.(
                                                        <TareDetail
                                                            tareId={
                                                                group.tare.id
                                                            }
                                                            tare={group.tare}
                                                            items={group.items}
                                                            label={
                                                                group.tare
                                                                    .barcode
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
                                                        <ChevronDown
                                                            size={14}
                                                        />
                                                    ) : (
                                                        <ChevronRight
                                                            size={14}
                                                        />
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
                                                        {
                                                            group.tare
                                                                .tareTypeUnits
                                                        }
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
                                                                openItem(
                                                                    slot.item,
                                                                )
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </>
                    )}

                    {unallocated.length > 0 && (
                        <>
                            <h5
                                style={{
                                    marginTop: '1rem',
                                    marginBottom: '0.5rem',
                                }}
                            >
                                Unallocated
                            </h5>
                            <OutputItemsPanel
                                items={unallocated}
                                onSlotClick={(item) => openItem(item)}
                            />
                        </>
                    )}
                </>
            )}
        </div>
    )
}
