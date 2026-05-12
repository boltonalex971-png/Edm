import api from '@features/api/api'
import Api from '@features/api/api'
import { Loading } from '@features/utils/Utils'
import {
    type AlertState,
    useAlertSetter,
} from '@logistics/components/InlineAlert'
import { Detail } from '@logistics/components/MasterDetail'
import { ItemDetail } from '@logistics/components/items/ItemDetail'
import '@logistics/components/items/ItemGenealogyTree.css'
import { TareDetail } from '@logistics/components/tare/TareDetail'
import {
    type TareGroup,
    groupByTare,
    tareSummary,
} from '@logistics/components/tare/TareItemsPanel'
import { TareSchematic } from '@logistics/components/tare/TareSchematic'
import type {
    DataItem,
    Item,
    ItemSearchQuery,
} from '@logistics/data/types'
import {
    useEntityToken,
    useInvalidateEntities,
} from '@logistics/hooks/entityRefresh'
import { usePost } from '@logistics/hooks/hooks'
import { Search as SearchIcon } from '@mui/icons-material'
import {
    Alert,
    Box,
    Button as MuiButton,
    Chip,
    InputAdornment,
    TextField,
} from '@mui/material'
import {
    DataGrid,
    type GridColDef,
    type GridRowParams,
    GRID_DETAIL_PANEL_TOGGLE_FIELD,
} from '@mui/x-data-grid'
import type React from 'react'
import {
    type ReactElement,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import { Diagram3 } from 'react-bootstrap-icons'

type ItemSearchProps = {
    onClose: () => void
    query?: ItemSearchQuery
    lookup?: React.ReactElement | boolean
    selected?: (
        items: Item[],
        setAlert: (alertState: AlertState) => void,
        onDone: () => void,
    ) => void
}

type TareRow = TareGroup & { id: string }

function sourceChip(items: Item[]) {
    const hasOutput = items.some((i) => i.isOutput)
    const hasSupply = items.some((i) => i.supplyId && !i.isOutput)
    const hasStore = items.some((i) => i.isStore)
    if (hasOutput) {
        return (
            <Chip
                size="small"
                label="Output"
                title="This tare contains items produced by an order execution."
                sx={{
                    height: 22,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    background: 'var(--ent-operation-soft)',
                    color: 'var(--ent-operation-deep)',
                    border: '1px solid var(--ent-operation-deep)',
                }}
            />
        )
    }
    if (hasSupply) {
        return (
            <Chip
                size="small"
                label="Supply"
                title="This tare contains items received through a supply."
                sx={{
                    height: 22,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    background: 'var(--ent-supply-soft)',
                    color: 'var(--ent-supply-deep)',
                    border: '1px solid var(--ent-supply-deep)',
                }}
            />
        )
    }
    if (hasStore) {
        return (
            <Chip
                size="small"
                label="Store"
                title="This tare contains items created directly from store."
                sx={{
                    height: 22,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    background: 'var(--surface-2)',
                    color: 'var(--ink-2)',
                    border: '1px solid var(--line-strong)',
                }}
            />
        )
    }
    return (
        <Box component="span" sx={{ color: 'var(--ink-3)' }} title="No supply or process recorded.">
            —
        </Box>
    )
}

export const ItemSearch = (props: ItemSearchProps) => {
    const token = useEntityToken([{ type: 'item' }, { type: 'tare' }])
    const invalidate = useInvalidateEntities()
    const [[items], loading, error] = usePost<Item[]>(
        `${api.items}/search`,
        props.query || {},
        [props.query?.nomenclatureId, props.query?.active, token],
    )
    const [subDetail, setSubDetail] = useState<ReactElement | undefined>()
    const [filter, setFilter] = useState<string>('')
    const setAlert = useAlertSetter()
    const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(
        new Set(),
    )
    const lastClickedRef = useRef<{ tareId: string; itemId: string } | null>(
        null,
    )

    useEffect(() => {
        setAlert(undefined)
    }, [props.query?.nomenclatureId])

    const tareRows: TareRow[] = useMemo(() => {
        if (!items) return []
        const lc = filter.toLowerCase()
        const filtered = lc
            ? items.filter(
                  (o) =>
                      o.nomenclatureName?.toLowerCase().includes(lc) ||
                      o.tareTareTypeName?.toLowerCase().includes(lc) ||
                      o.tareBarcode?.toLowerCase().includes(lc),
              )
            : items
        return groupByTare(filtered).map((g) => ({
            ...g,
            id: g.tare.id || 'no-tare',
        }))
    }, [filter, items])

    const handleSlotSelect = useCallback(
        (item: Item, tareId: string, shiftKey: boolean) => {
            if (
                shiftKey &&
                lastClickedRef.current &&
                lastClickedRef.current.tareId === tareId
            ) {
                const group = tareRows.find((r) => r.id === tareId)
                if (group) {
                    const sorted = [...group.items]
                        .filter((i) => i.address != null)
                        .sort((a, b) => a.address! - b.address!)
                    const lastIdx = sorted.findIndex(
                        (i) => i.id === lastClickedRef.current!.itemId,
                    )
                    const curIdx = sorted.findIndex((i) => i.id === item.id)
                    if (lastIdx >= 0 && curIdx >= 0) {
                        const lo = Math.min(lastIdx, curIdx)
                        const hi = Math.max(lastIdx, curIdx)
                        setSelectedItemIds((prev) => {
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
            setSelectedItemIds((prev) => {
                const next = new Set(prev)
                if (next.has(item.id)) {
                    next.delete(item.id)
                } else {
                    next.add(item.id)
                }
                return next
            })
            lastClickedRef.current = { tareId, itemId: item.id }
        },
        [tareRows],
    )

    const doRefresh = useCallback(() => {
        invalidate([{ type: 'item' }, { type: 'tare' }])
        setSelectedItemIds(new Set())
    }, [invalidate])

    const allocateSelected = () => {
        if (!props.selected || selectedItemIds.size === 0 || !items) return
        const selected = items
            .filter((i) => selectedItemIds.has(i.id))
            .sort((a, b) => (a.address ?? 0) - (b.address ?? 0))
        props.selected(selected, setAlert, doRefresh)
    }

    const lookupActive = !!props.lookup

    const getDetailPanelContent = useCallback(
        ({ row }: { row: TareRow }) => {
            const selectedAddresses = new Set(
                row.items
                    .filter((i) => selectedItemIds.has(i.id))
                    .map((i) => i.address)
                    .filter((a): a is number => a != null),
            )
            return (
                <Box sx={{ p: 1 }}>
                    <TareSchematic
                        tare={row.tare}
                        items={row.items}
                        selectedSlots={
                            lookupActive ? selectedAddresses : undefined
                        }
                        onSlotClick={(slot, event) => {
                            if (slot.item && lookupActive) {
                                handleSlotSelect(
                                    slot.item,
                                    row.id,
                                    event.shiftKey,
                                )
                            } else if (slot.item && !lookupActive) {
                                setSubDetail(
                                    <ItemDetail
                                        readonly={true}
                                        id={slot.item.id}
                                        api={Api.items}
                                        onClose={() => setSubDetail(undefined)}
                                    />,
                                )
                            }
                        }}
                    />
                </Box>
            )
        },
        [handleSlotSelect, lookupActive, selectedItemIds],
    )

    const getDetailPanelHeight = useCallback(() => 'auto' as const, [])

    const columns: GridColDef<TareRow>[] = useMemo(
        () => [
            {
                ...({} as any),
                field: GRID_DETAIL_PANEL_TOGGLE_FIELD,
                width: 40,
            },
            {
                field: 'barcode',
                headerName: 'Barcode',
                flex: 1,
                minWidth: 140,
                valueGetter: (_v, r) => r.tare.barcode || '(none)',
            },
            {
                field: 'tareTypeName',
                headerName: 'Tare Type',
                flex: 1,
                minWidth: 140,
                valueGetter: (_v, r) => r.tare.tareTypeName,
            },
            {
                field: 'nomenclatures',
                headerName: 'Nomenclatures',
                flex: 1.4,
                minWidth: 180,
                valueGetter: (_v, r) =>
                    [...new Set(r.items.map((i) => i.nomenclatureName))].join(
                        ', ',
                    ),
            },
            {
                field: 'fill',
                headerName: 'Fill',
                width: 110,
                valueGetter: (_v, r) => tareSummary(r),
            },
            {
                field: 'source',
                headerName: 'Source',
                width: 100,
                renderCell: (p) => sourceChip(p.row.items),
                sortable: false,
                filterable: false,
            },
            {
                field: 'units',
                headerName: 'Units',
                width: 80,
                valueGetter: (_v, r) => r.tare.tareTypeUnits,
            },
        ],
        [],
    )

    const onRowClick = (p: GridRowParams<TareRow>) => {
        if (lookupActive) return
        setSubDetail(
            <TareDetail
                tareId={p.row.tare.id}
                label={p.row.tare.barcode}
                onClose={() => setSubDetail(undefined)}
            />,
        )
    }

    const onRowDoubleClick = (p: GridRowParams<TareRow>) => {
        if (typeof props.lookup === 'boolean' && props.lookup && props.selected) {
            const sorted = [...p.row.items].sort(
                (a, b) => (a.address ?? 0) - (b.address ?? 0),
            )
            props.selected(sorted, setAlert, doRefresh)
        }
    }

    return (
        <Detail
            type="item"
            onClose={props.onClose}
            icon={<Diagram3 title="Components" />}
            loading={loading}
            error={error as string}
            data={
                {
                    name: `Component ${props.lookup ? 'lookup' : 'search'}`,
                    description: props.lookup
                        ? 'Binding component to the order'
                        : 'Search for components',
                } as DataItem
            }
            subDetail={subDetail}
            card={
                <Box>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Search by nomenclature, tare or barcode"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        sx={{ mb: 1.5 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                    />
                    {props.lookup && selectedItemIds.size > 0 && (
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-end',
                                gap: 1,
                                mb: 1,
                            }}
                        >
                            <MuiButton
                                variant="contained"
                                size="small"
                                onClick={allocateSelected}
                            >
                                Allocate {selectedItemIds.size} selected
                            </MuiButton>
                            <MuiButton
                                size="small"
                                onClick={() => setSelectedItemIds(new Set())}
                            >
                                Clear selection
                            </MuiButton>
                        </Box>
                    )}
                    {loading && <Loading />}
                    {error && (
                        <Alert severity="error" sx={{ mb: 1 }}>
                            {error as string}
                        </Alert>
                    )}
                    {tareRows && (
                        <DataGrid
                            rows={tareRows}
                            columns={columns}
                            autoHeight
                            density="compact"
                            disableRowSelectionOnClick
                            getDetailPanelContent={getDetailPanelContent}
                            getDetailPanelHeight={getDetailPanelHeight}
                            initialState={{
                                pagination: {
                                    paginationModel: { pageSize: 10, page: 0 },
                                },
                            }}
                            pageSizeOptions={[10, 25, 50]}
                            onRowClick={onRowClick}
                            onRowDoubleClick={onRowDoubleClick}
                            sx={{
                                '& .MuiDataGrid-row': { cursor: 'pointer' },
                            }}
                        />
                    )}
                </Box>
            }
        />
    )
}
