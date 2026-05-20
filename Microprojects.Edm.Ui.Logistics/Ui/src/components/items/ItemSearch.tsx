import './index' // side-effect: registers the `items` namespace
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
import {
    ExpandLessOutlined as ChevDown,
    ExpandMoreOutlined as ChevRight,
    InboxOutlined as EmptyIcon,
    Search as SearchIcon,
} from '@mui/icons-material'
import {
    Alert,
    Box,
    Button as MuiButton,
    Chip,
    IconButton,
    InputAdornment,
    TextField,
    Typography,
} from '@mui/material'
import type React from 'react'
import {
    type ReactElement,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import { type TFunction, useTranslation } from 'react-i18next'

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

function sourceChip(items: Item[], t: TFunction) {
    const hasOutput = items.some((i) => i.isOutput)
    const hasSupply = items.some((i) => i.supplyId && !i.isOutput)
    const hasStore = items.some((i) => i.isStore)
    if (hasOutput) {
        return (
            <Chip
                size="small"
                label={t('source.Output', 'Output')}
                title={t('source.tareOutputTitle', 'This tare contains items produced by an order execution.')}
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
                label={t('source.Supply', 'Supply')}
                title={t('source.tareSupplyTitle', 'This tare contains items received through a supply.')}
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
                label={t('source.Store', 'Store')}
                title={t('source.tareStoreTitle', 'This tare contains items created directly from store.')}
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
        <Box component="span" sx={{ color: 'var(--ink-3)' }} title={t('source.noRecorded', 'No supply or process recorded.')}>
            —
        </Box>
    )
}

// Column geometry — shared by header and rows so they line up. The chevron
// column is fixed-width on the left; the rest are flex-sized with min-widths
// matching the previous DataGrid layout.
const COL_SX = {
    chev: { width: 32, flexShrink: 0 } as const,
    barcode: { flex: '1 1 140px', minWidth: 0 } as const,
    type: { flex: '1 1 140px', minWidth: 0 } as const,
    nomenclatures: { flex: '1.4 1 180px', minWidth: 0 } as const,
    fill: { width: 110, flexShrink: 0 } as const,
    source: { width: 100, flexShrink: 0 } as const,
    units: { width: 80, flexShrink: 0 } as const,
}

const ROW_SX = {
    display: 'flex',
    alignItems: 'center',
    gap: 1.5,
    px: 1,
    py: 0.75,
    borderBottom: '1px solid var(--line)',
} as const

const HEADER_LABEL_SX = {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.07em',
    color: 'var(--ink-3)',
}

const TRUNCATE_SX = {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
}

export const ItemSearch = (props: ItemSearchProps) => {
    const { t } = useTranslation('items')
    const { t: tTare } = useTranslation('tare')
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
    // Tare-row expansion. Rows start collapsed — the user expands what they
    // need. Click the chevron (or the row in lookup mode) to toggle.
    const [expanded, setExpanded] = useState<Set<string>>(new Set())

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

    const toggleExpand = useCallback((key: string) => {
        setExpanded((prev) => {
            const next = new Set(prev)
            if (next.has(key)) next.delete(key)
            else next.add(key)
            return next
        })
    }, [])

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

    // Click-vs-double-click coordinator: in lookup mode the row click toggles
    // expansion, double-click allocates the whole tare. We delay the toggle by
    // 220 ms so a double-click can cancel it (mirrors ComponentLookup).
    const pendingRowClickRef = useRef<ReturnType<typeof setTimeout> | null>(
        null,
    )
    const cancelPendingRowClick = () => {
        if (pendingRowClickRef.current) {
            clearTimeout(pendingRowClickRef.current)
            pendingRowClickRef.current = null
        }
    }
    const onRowClick = (row: TareRow) => {
        if (!lookupActive) {
            setSubDetail(
                <TareDetail
                    tareId={row.tare.id}
                    label={row.tare.barcode}
                    onClose={() => setSubDetail(undefined)}
                />,
            )
            return
        }
        cancelPendingRowClick()
        const timer = setTimeout(() => {
            toggleExpand(row.id)
            pendingRowClickRef.current = null
        }, 220)
        pendingRowClickRef.current = timer
    }
    const onRowDoubleClick = (row: TareRow) => {
        cancelPendingRowClick()
        if (
            typeof props.lookup === 'boolean' &&
            props.lookup &&
            props.selected
        ) {
            const sorted = [...row.items].sort(
                (a, b) => (a.address ?? 0) - (b.address ?? 0),
            )
            props.selected(sorted, setAlert, doRefresh)
        }
    }

    return (
        <Detail
            type="item"
            onClose={props.onClose}
            icon={<SearchIcon />}
            loading={loading}
            error={error as string}
            data={
                {
                    name: props.lookup
                        ? t('search.titleLookup', 'Component lookup')
                        : t('search.title', 'Component search'),
                    description: props.lookup
                        ? t('search.subtitleLookup', 'Binding component to the order')
                        : t('search.subtitle', 'Search for components'),
                } as DataItem
            }
            subDetail={subDetail}
            card={
                <Box>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder={t('search.placeholder', 'Search by nomenclature, tare or barcode')}
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
                                {t('search.allocateSelected', {
                                    count: selectedItemIds.size,
                                    defaultValue: 'Allocate {{count}} selected',
                                })}
                            </MuiButton>
                            <MuiButton
                                size="small"
                                onClick={() => setSelectedItemIds(new Set())}
                            >
                                {t('search.clearSelection', 'Clear selection')}
                            </MuiButton>
                        </Box>
                    )}
                    {loading && <Loading />}
                    {error && (
                        <Alert severity="error" sx={{ mb: 1 }}>
                            {error as string}
                        </Alert>
                    )}
                    {!loading && tareRows.length === 0 && (
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 1,
                                py: 3,
                                color: 'var(--ink-3)',
                                fontStyle: 'italic',
                            }}
                        >
                            <EmptyIcon
                                sx={{ fontSize: 32, color: 'var(--ink-4)' }}
                            />
                            <Typography variant="caption">
                                {filter
                                    ? t('search.nothingMatches', {
                                          filter,
                                          defaultValue: 'Nothing matches "{{filter}}".',
                                      })
                                    : t('search.noItems', 'No items match the current query.')}
                            </Typography>
                        </Box>
                    )}
                    {!loading && tareRows.length > 0 && (
                        <Box
                            sx={{
                                border: '1px solid var(--line)',
                                borderRadius: 'var(--r-2)',
                                overflow: 'hidden',
                                background: 'var(--surface)',
                            }}
                        >
                            <Box
                                sx={{
                                    ...ROW_SX,
                                    background: 'var(--surface-2)',
                                    py: 0.5,
                                }}
                            >
                                <Box sx={COL_SX.chev} />
                                <Box sx={{ ...COL_SX.barcode, ...HEADER_LABEL_SX }}>
                                    {t('search.col.barcode', 'Barcode')}
                                </Box>
                                <Box sx={{ ...COL_SX.type, ...HEADER_LABEL_SX }}>
                                    {t('search.col.tareType', 'Tare type')}
                                </Box>
                                <Box
                                    sx={{
                                        ...COL_SX.nomenclatures,
                                        ...HEADER_LABEL_SX,
                                    }}
                                >
                                    {t('search.col.nomenclatures', 'Nomenclatures')}
                                </Box>
                                <Box sx={{ ...COL_SX.fill, ...HEADER_LABEL_SX }}>
                                    {t('search.col.fill', 'Fill')}
                                </Box>
                                <Box sx={{ ...COL_SX.source, ...HEADER_LABEL_SX }}>
                                    {t('search.col.source', 'Source')}
                                </Box>
                                <Box sx={{ ...COL_SX.units, ...HEADER_LABEL_SX }}>
                                    {t('search.col.units', 'Units')}
                                </Box>
                            </Box>
                            {tareRows.map((row) => {
                                const isExpanded = expanded.has(row.id)
                                const ChevIcon = isExpanded ? ChevDown : ChevRight
                                const selectedAddresses = new Set(
                                    row.items
                                        .filter((i) => selectedItemIds.has(i.id))
                                        .map((i) => i.address)
                                        .filter((a): a is number => a != null),
                                )
                                const allSelected =
                                    lookupActive &&
                                    row.items.length > 0 &&
                                    row.items.every((i) =>
                                        selectedItemIds.has(i.id),
                                    )
                                const nomenclatures = [
                                    ...new Set(
                                        row.items.map((i) => i.nomenclatureName),
                                    ),
                                ].join(', ')
                                return (
                                    <Box
                                        key={row.id}
                                        sx={{
                                            background: allSelected
                                                ? 'var(--accent-tint)'
                                                : 'transparent',
                                            '&:last-of-type > .row-head': {
                                                borderBottom: 'none',
                                            },
                                        }}
                                    >
                                        <Box
                                            className="row-head"
                                            onClick={() => onRowClick(row)}
                                            onDoubleClick={() =>
                                                onRowDoubleClick(row)
                                            }
                                            title={
                                                lookupActive
                                                    ? t('search.rowTitleLookup', 'Click to expand · double-click to allocate the whole tare')
                                                    : t('search.rowTitleOpen', 'Click to open the tare')
                                            }
                                            sx={{
                                                ...ROW_SX,
                                                cursor: 'pointer',
                                                userSelect: 'none',
                                                '&:hover': {
                                                    background: allSelected
                                                        ? 'var(--accent-tint)'
                                                        : 'var(--surface-2)',
                                                },
                                            }}
                                        >
                                            <Box sx={COL_SX.chev}>
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        toggleExpand(row.id)
                                                    }}
                                                    sx={{ p: 0.25 }}
                                                >
                                                    <ChevIcon
                                                        fontSize="small"
                                                        sx={{ color: 'var(--ink-3)' }}
                                                    />
                                                </IconButton>
                                            </Box>
                                            <Typography
                                                sx={{
                                                    ...COL_SX.barcode,
                                                    ...TRUNCATE_SX,
                                                    fontFamily:
                                                        'var(--font-mono)',
                                                    fontSize: 13,
                                                    fontWeight: 700,
                                                    color: 'var(--ink-1)',
                                                }}
                                                title={row.tare.barcode || ''}
                                            >
                                                {row.tare.barcode || t('search.noBarcode', '(none)')}
                                            </Typography>
                                            <Typography
                                                sx={{
                                                    ...COL_SX.type,
                                                    ...TRUNCATE_SX,
                                                    fontSize: 13,
                                                    color: 'var(--ink-2)',
                                                }}
                                                title={row.tare.tareTypeName ?? ''}
                                            >
                                                {row.tare.tareTypeName}
                                            </Typography>
                                            <Typography
                                                sx={{
                                                    ...COL_SX.nomenclatures,
                                                    ...TRUNCATE_SX,
                                                    fontSize: 13,
                                                    color: 'var(--ink-2)',
                                                }}
                                                title={nomenclatures}
                                            >
                                                {nomenclatures}
                                            </Typography>
                                            <Typography
                                                sx={{
                                                    ...COL_SX.fill,
                                                    fontSize: 12,
                                                    fontFamily:
                                                        'var(--font-mono)',
                                                    color: 'var(--ink-2)',
                                                }}
                                            >
                                                {tareSummary(row, tTare)}
                                            </Typography>
                                            <Box sx={COL_SX.source}>
                                                {sourceChip(row.items, t)}
                                            </Box>
                                            <Typography
                                                sx={{
                                                    ...COL_SX.units,
                                                    fontSize: 12,
                                                    color: 'var(--ink-3)',
                                                }}
                                            >
                                                {row.tare.tareTypeUnits}
                                            </Typography>
                                        </Box>
                                        {isExpanded && (
                                            <Box
                                                sx={{
                                                    px: 1.5,
                                                    py: 1,
                                                    borderBottom:
                                                        '1px solid var(--line)',
                                                    background: 'var(--surface-2)',
                                                }}
                                            >
                                                <TareSchematic
                                                    tare={row.tare}
                                                    items={row.items}
                                                    selectedSlots={
                                                        lookupActive
                                                            ? selectedAddresses
                                                            : undefined
                                                    }
                                                    onSlotClick={(slot, event) => {
                                                        if (
                                                            slot.item &&
                                                            lookupActive
                                                        ) {
                                                            handleSlotSelect(
                                                                slot.item,
                                                                row.id,
                                                                event.shiftKey,
                                                            )
                                                        } else if (
                                                            slot.item &&
                                                            !lookupActive
                                                        ) {
                                                            setSubDetail(
                                                                <ItemDetail
                                                                    readonly={
                                                                        true
                                                                    }
                                                                    id={slot.item.id}
                                                                    api={Api.items}
                                                                    onClose={() =>
                                                                        setSubDetail(
                                                                            undefined,
                                                                        )
                                                                    }
                                                                />,
                                                            )
                                                        }
                                                    }}
                                                />
                                            </Box>
                                        )}
                                    </Box>
                                )
                            })}
                        </Box>
                    )}
                </Box>
            }
        />
    )
}
