import React, {type ReactElement, useEffect, useMemo, useRef, useState} from 'react'
import {Diagram3, Search} from 'react-bootstrap-icons'
import {Button} from '@progress/kendo-react-buttons'
import api from '@features/api/api'
import {usePost} from '@logistics/hooks/hooks'
import type {DataItem, Item, ItemSearchQuery, UUID} from '@logistics/data/types'
import {InputPrefix, TextBox, type TextBoxChangeEvent} from '@progress/kendo-react-inputs'
import {Loading} from '@features/utils/Utils'
import {Error} from '@progress/kendo-react-labels'
import {
    Grid,
    GridColumn,
    type GridDetailRowProps,
    type GridExpandChangeEvent,
    type GridPageChangeEvent,
    type GridRowClickEvent,
} from '@progress/kendo-react-grid'
import {process} from '@progress/kendo-data-query'
import Api from '@features/api/api'
import {Detail} from '@logistics/components/MasterDetail'
import {type AlertState, InlineAlert} from '@logistics/components/InlineAlert'
import {ItemDetail} from '@logistics/components/items/ItemDetail'
import {TareDetail} from '@logistics/components/tare/TareDetail'
import {TareSchematic} from '@logistics/components/tare/TareSchematic'
import {groupByTare, tareSummary, type TareGroup} from '@logistics/components/tare/TareItemsPanel'

type ItemSearchProps = {
    onClose: () => void
    query?: ItemSearchQuery
    lookup?: React.ReactElement | boolean
    selected?: (items: Item[], setAlert: (alertState: AlertState) => void, onDone: () => void) => void
}

let refresh: boolean = false

type TareRow = TareGroup & {expanded?: boolean}

export const ItemSearch = (props: ItemSearchProps) => {
    const [[items], loading, error] = usePost<Item[]>(
        `${api.items}/search`, props.query || {},
        [props.query?.nomenclatureId, props.query?.active, refresh],
    )
    const [subDetail, setSubDetail] = useState<ReactElement | undefined>()
    const [filter, setFilter] = useState<string>('')
    const [alert, setAlert] = useState<AlertState>()
    const [expandedTares, setExpandedTares] = useState<Set<string>>(new Set())
    const [page, setPage] = useState({skip: 0, take: 10})
    const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set())
    const lastClickedRef = useRef<{tareId: string; itemId: string} | null>(null)

    useEffect(() => {
        setAlert(undefined)
    }, [props.query?.nomenclatureId])

    const tareRows: TareRow[] = useMemo(() => {
        if (!items) return []
        const lc = filter.toLowerCase()
        const filtered = lc
            ? items.filter(o =>
                o.nomenclatureName?.toLowerCase().includes(lc) ||
                o.tareTareTypeName?.toLowerCase().includes(lc) ||
                o.tareBarcode?.toLowerCase().includes(lc)
            )
            : items
        return groupByTare(filtered).map(g => ({
            ...g,
            expanded: expandedTares.has(g.tare.id || 'no-tare'),
        }))
    }, [filter, items, expandedTares])

    const pagedData = useMemo(
        () => process(tareRows, {skip: page.skip, take: page.take}),
        [tareRows, page.skip, page.take],
    )

    const filterChange = (event: TextBoxChangeEvent) => {
        setFilter(event.value?.toString() || '')
        setPage({skip: 0, take: 10})
    }

    const pageChange = (event: GridPageChangeEvent) => {
        setPage({...event.page, take: 10})
    }

    const onExpandChange = (event: GridExpandChangeEvent) => {
        const tareId = event.dataItem.tare.id || 'no-tare'
        setExpandedTares(prev => {
            const next = new Set(prev)
            if (next.has(tareId)) {
                next.delete(tareId)
            } else {
                next.add(tareId)
            }
            return next
        })
    }

    const rowClick = (event: GridRowClickEvent) => {
        const row = event.dataItem as TareRow
        if (props.lookup) {
            return
        }
        setSubDetail(
            <TareDetail
                tareId={row.tare.id}
                label={row.tare.barcode}
                onClose={() => setSubDetail(undefined)}
            />
        )
    }

    const handleSlotSelect = (item: Item, tareId: string, shiftKey: boolean) => {
        if (shiftKey && lastClickedRef.current && lastClickedRef.current.tareId === tareId) {
            const group = tareRows.find(r => (r.tare.id || 'no-tare') === tareId)
            if (group) {
                const sorted = [...group.items]
                    .filter(i => i.address != null)
                    .sort((a, b) => a.address! - b.address!)
                const lastIdx = sorted.findIndex(i => i.id === lastClickedRef.current!.itemId)
                const curIdx = sorted.findIndex(i => i.id === item.id)
                if (lastIdx >= 0 && curIdx >= 0) {
                    const lo = Math.min(lastIdx, curIdx)
                    const hi = Math.max(lastIdx, curIdx)
                    setSelectedItemIds(prev => {
                        const next = new Set(prev)
                        for (let i = lo; i <= hi; i++) {
                            next.add(sorted[i].id)
                        }
                        return next
                    })
                    return
                }
            }
        }
        setSelectedItemIds(prev => {
            const next = new Set(prev)
            if (next.has(item.id)) {
                next.delete(item.id)
            } else {
                next.add(item.id)
            }
            return next
        })
        lastClickedRef.current = {tareId, itemId: item.id}
    }

    const doRefresh = () => {
        refresh = !refresh
        setSelectedItemIds(new Set())
        setAlert(a => a)
    }

    const allocateSelected = () => {
        if (!props.selected || selectedItemIds.size === 0 || !items) {
            return
        }
        const selected = items
            .filter(i => selectedItemIds.has(i.id))
            .sort((a, b) => (a.address ?? 0) - (b.address ?? 0))
        props.selected(selected, setAlert, doRefresh)
    }

    const rowDoubleClick = (event: GridRowClickEvent) => {
        if (typeof props.lookup === 'boolean' && props.lookup && props.selected) {
            const row = event.dataItem as TareRow
            const sorted = [...row.items].sort((a, b) => (a.address ?? 0) - (b.address ?? 0))
            props.selected(sorted, setAlert, doRefresh)
        }
    }

    const DetailRow = (detailProps: GridDetailRowProps) => {
        const row = detailProps.dataItem as TareRow
        const tareKey = row.tare.id || 'no-tare'
        const selectedAddresses = new Set(
            row.items
                .filter(i => selectedItemIds.has(i.id))
                .map(i => i.address)
                .filter((a): a is number => a != null),
        )
        return (
            <TareSchematic
                tare={row.tare}
                items={row.items}
                selectedSlots={props.lookup ? selectedAddresses : undefined}
                onSlotClick={(slot, event) => {
                    if (slot.item && props.lookup) {
                        handleSlotSelect(slot.item, tareKey, event.shiftKey)
                    } else if (slot.item && !props.lookup) {
                        setSubDetail(
                            <ItemDetail
                                readonly={true}
                                id={slot.item.id}
                                api={Api.items}
                                onClose={() => setSubDetail(undefined)}
                            />
                        )
                    }
                }}
            />
        )
    }

    return (
        <Detail
            onClose={props.onClose}
            icon={<Diagram3 title="Components" />}
            loading={loading}
            error={error as string}
            data={{
                name: `Component ${props.lookup ? 'lookup' : 'search'}`,
                description: props.lookup ? 'Binding component to the order' : 'Search for components',
            } as DataItem}
            subDetail={subDetail}
            card={
                <>
                    <TextBox
                        inputMode="text"
                        placeholder="Search by nomenclature, tare or barcode"
                        prefix={() =>
                            <InputPrefix>
                                <Search width={30} />
                            </InputPrefix>
                        }
                        style={{marginBottom: '1rem'}}
                        onChange={filterChange}
                    />
                    {props.lookup && selectedItemIds.size > 0 && (
                        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem', marginBottom: '0.5rem'}}>
                            <Button
                                themeColor="primary"
                                size="small"
                                onClick={allocateSelected}
                            >
                                Allocate {selectedItemIds.size} selected
                            </Button>
                            <Button
                                size="small"
                                onClick={() => setSelectedItemIds(new Set())}
                            >
                                Clear selection
                            </Button>
                        </div>
                    )}
                    {loading && <Loading />}
                    {error && <Error>{error}</Error>}
                    {tareRows && (
                        <>
                            <InlineAlert state={alert} onClose={() => setAlert(undefined)} />
                            <Grid
                                data={pagedData}
                                scrollable="none"
                                pageable={true}
                                pageSize={10}
                                skip={page.skip}
                                take={page.take}
                                total={tareRows.length}
                                onPageChange={pageChange}
                                detail={DetailRow}
                                expandField="expanded"
                                onExpandChange={onExpandChange}
                                onRowClick={rowClick}
                                onRowDoubleClick={rowDoubleClick}
                            >
                                <GridColumn
                                    field="tare.barcode"
                                    title="Barcode"
                                    width="150"
                                    cell={(p) => <td>{p.dataItem.tare.barcode || '(none)'}</td>}
                                />
                                <GridColumn
                                    field="tare.tareTypeName"
                                    title="Tare Type"
                                    width="130"
                                    cell={(p) => <td>{p.dataItem.tare.tareTypeName}</td>}
                                />
                                <GridColumn
                                    title="Nomenclatures"
                                    cell={(p) => {
                                        const row = p.dataItem as TareRow
                                        const names = [...new Set(row.items.map(i => i.nomenclatureName))]
                                        return <td>{names.join(', ')}</td>
                                    }}
                                />
                                <GridColumn
                                    title="Fill"
                                    width="120"
                                    cell={(p) => <td>{tareSummary(p.dataItem)}</td>}
                                />
                                <GridColumn
                                    field="tare.tareTypeUnits"
                                    title="Units"
                                    width="80"
                                    cell={(p) => <td>{p.dataItem.tare.tareTypeUnits}</td>}
                                />
                            </Grid>
                        </>
                    )}
                    <div className="mt-2" />
                </>
            }
        />
    )
}
