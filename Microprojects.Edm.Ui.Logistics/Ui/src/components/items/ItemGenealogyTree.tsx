import Api from '@features/api/api'
import { Loading } from '@features/utils/Utils'
import { EMPTY_GUID } from '@logistics/components/MasterDetail.tsx'
import type {
    GenealogyEdge,
    ItemGenealogy,
    ItemNode,
    UUID,
} from '@logistics/data/types'
import { useGet } from '@logistics/hooks/hooks'
import { formatUnits } from '@logistics/utils/format'
import {
    Alert,
    Box,
    Paper,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    Typography,
} from '@mui/material'
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView'
import { TreeItem } from '@mui/x-tree-view/TreeItem'
import type React from 'react'
import {
    AccountTreeOutlined as GenealogyIcon,
    ChevronLeftOutlined as ChevronLeft,
    ChevronRightOutlined as ChevronRight,
} from '@mui/icons-material'
import { useEffect, useMemo, useState } from 'react'
import './ItemGenealogyTree.css'

export interface ItemGenealogyTreeProps {
    itemId: UUID
    /** Fired when the user clicks a node. */
    onSelect?: (itemId: UUID) => void
}

/** Item-origin tokens shown inside the chevron pill. */
type OriginKind = 'out' | 'supply' | 'store' | 'split'
type EdgeArrow = 'left' | 'right'

/** Structured fields rendered inside the tooltip popover for a node. */
type TooltipFields = {
    name: string
    category?: string
    /** Origin sub-line — process name for OUT, plain word otherwise. */
    source?: string
    quantity: string
    /** Edge-consumed quantity, only when meaningfully different from `quantity`. */
    consumed?: string
    serialNo?: string
    tare?: string
    address?: string
    /** When true, render the popover with the inactive (greyed) accent. */
    inactive?: boolean
    /** Synthetic group rows use a single text line instead of the field grid. */
    note?: string
}

type GenealogyItem = {
    id: string
    /** Undefined for synthetic group rows. */
    itemId?: UUID
    name: string
    quantityText: string
    orderNumber?: string
    tooltipFields: TooltipFields
    inactive: boolean
    isOutput: boolean
    /** Origin classification of the displayed item — drives the pill label. */
    originKind?: OriginKind
    /** Uppercase label rendered inside the pill (OUT / SUPPLY / STORE / SPLIT). */
    originLabel?: string
    edgeArrow: EdgeArrow
    items: GenealogyItem[]
    depth: number
    hasMore: boolean
    /** Synthetic row that wraps N similar siblings into one collapsible entry. */
    isGroup?: boolean
    groupCount?: number
}

type DepthChoice = 2 | 5 | 0 // 0 = full tree

function nodeName(n: ItemNode): string {
    return (
        n.nomenclatureName ??
        (n.serialNo ? `SN ${n.serialNo}` : `Item ${n.id.slice(0, 8)}`)
    )
}

/**
 * Item's own quantity under the immutable-Quantity model: set at creation,
 * never decremented (consumption flows through ItemLinks). The edge's
 * consumed quantity is shown separately in the tooltip.
 */
function nodeQuantityText(n: ItemNode): string {
    return formatUnits(n.quantity, n.tareTypeUnits, n.nomenclatureCountable)
}

/** Build the structured fields shown inside the tooltip. */
function nodeTooltipFields(
    n: ItemNode,
    edge: GenealogyEdge | undefined,
    kind: OriginKind,
): TooltipFields {
    const tare =
        n.tareTypeName || n.tareBarcode
            ? [n.tareTypeName, n.tareBarcode].filter(Boolean).join(' / ')
            : undefined
    const quantity = formatUnits(
        n.quantity,
        n.tareTypeUnits,
        n.nomenclatureCountable,
    )
    const consumed =
        edge != null
            ? formatUnits(
                  edge.consumedQuantity,
                  n.tareTypeUnits,
                  n.nomenclatureCountable,
              )
            : undefined
    return {
        name: nodeName(n),
        category: n.nomenclatureCategory ?? undefined,
        source: sourceLine(kind, edge),
        quantity,
        consumed: consumed && consumed !== quantity ? consumed : undefined,
        serialNo: n.serialNo,
        tare,
        address: n.address != null ? String(n.address) : undefined,
        inactive: n.inactive,
    }
}

/** One-line "where did this row come from" — process name for OUT, plain origin word otherwise. */
function sourceLine(kind: OriginKind, edge?: GenealogyEdge): string | undefined {
    if (kind === 'out') {
        return edge?.processName ? `Process: ${edge.processName}` : 'Execution output'
    }
    if (kind === 'supply') return 'Supply receipt'
    if (kind === 'store') return 'Store entry'
    if (kind === 'split') {
        return edge?.orderProcessId == null ? 'Split from parent' : undefined
    }
    return undefined
}

/**
 * Classify a node into an item-origin token. Mirrors ItemDetail's
 * Output/Supply/Store badges; SPLIT is the residual case for items that
 * came from splitting/repacking a parent (have an incoming non-exec link).
 */
function originKind(n: ItemNode): OriginKind {
    if (n.isOutput) return 'out'
    if (n.supplyId) return 'supply'
    if (n.isStore) return 'store'
    return 'split'
}

const ORIGIN_LABELS: Record<OriginKind, string> = {
    out: 'OUT',
    supply: 'SUPPLY',
    store: 'STORE',
    split: 'SPLIT',
}

/** Stable signature for grouping visually-identical siblings. */
function similaritySignature(item: GenealogyItem): string {
    return [
        item.name,
        item.quantityText,
        item.orderNumber ?? '',
        item.originKind ?? '',
        item.inactive ? 'I' : '',
    ].join('|')
}

/**
 * Collapse runs of look-alike siblings into a single synthetic group row.
 * Groups appear collapsed by default; the underlying items become children
 * of the group entry and the user can expand them with the tree's chevron.
 */
function groupSiblings(children: GenealogyItem[], path: string): GenealogyItem[] {
    const order: string[] = []
    const buckets = new Map<string, GenealogyItem[]>()
    for (const c of children) {
        const sig = similaritySignature(c)
        if (!buckets.has(sig)) {
            buckets.set(sig, [])
            order.push(sig)
        }
        buckets.get(sig)!.push(c)
    }
    return order.flatMap((sig) => {
        const items = buckets.get(sig)!
        if (items.length < 2) {
            return items
        }
        const head = items[0]
        const groupId = `${path}/group:${sig}`
        return [
            {
                id: groupId,
                isGroup: true,
                groupCount: items.length,
                name: head.name,
                quantityText: head.quantityText,
                orderNumber: head.orderNumber,
                tooltipFields: {
                    name: head.tooltipFields.name,
                    quantity: head.tooltipFields.quantity,
                    note: `${items.length} similar items grouped — expand to see individual entries`,
                },
                inactive: head.inactive,
                isOutput: head.isOutput,
                originKind: head.originKind,
                originLabel: head.originLabel,
                edgeArrow: head.edgeArrow,
                items,
                depth: head.depth,
                hasMore: false,
            } satisfies GenealogyItem,
        ]
    })
}

/**
 * Walk up/down the edge set from the root, yielding a tree dataset.
 *
 * direction = "ancestors"   → follow TargetItemId == currentId, ascend via SourceItemId.
 * direction = "descendants" → follow SourceItemId == currentId, descend via TargetItemId.
 */
function buildTree(
    rootId: UUID,
    nodes: Map<UUID, ItemNode>,
    edges: GenealogyEdge[],
    direction: 'ancestors' | 'descendants',
): GenealogyItem[] {
    const byPrimary = new Map<UUID, GenealogyEdge[]>()
    for (const e of edges) {
        const key = direction === 'ancestors' ? e.targetItemId : e.sourceItemId
        const list = byPrimary.get(key) ?? []
        list.push(e)
        byPrimary.set(key, list)
    }

    const visited = new Set<UUID>()
    const arrow: EdgeArrow = direction === 'ancestors' ? 'left' : 'right'

    function recurse(currentId: UUID, path: string): GenealogyItem[] {
        const outgoing = byPrimary.get(currentId) ?? []
        const children = outgoing.map((edge, idx): GenealogyItem => {
            const nextId =
                direction === 'ancestors'
                    ? edge.sourceItemId
                    : edge.targetItemId
            const node = nodes.get(nextId)
            const nodeKey = `${path}/${idx}:${nextId}`
            const cycle = visited.has(nextId)
            visited.add(nextId)
            const kind = node ? originKind(node) : undefined
            const fields: TooltipFields = node
                ? nodeTooltipFields(node, edge, kind!)
                : { name: `(missing ${nextId.slice(0, 8)})`, quantity: '—' }
            return {
                id: nodeKey,
                itemId: nextId,
                name: node ? nodeName(node) : `(missing ${nextId.slice(0, 8)})`,
                quantityText: node ? nodeQuantityText(node) : '—',
                orderNumber: node?.orderNumber ?? undefined,
                tooltipFields: fields,
                inactive: node?.inactive ?? false,
                isOutput: node?.isOutput ?? false,
                originKind: kind,
                originLabel: kind ? ORIGIN_LABELS[kind] : undefined,
                edgeArrow: arrow,
                items: cycle ? [] : recurse(nextId, nodeKey),
                depth: node?.depth ?? 0,
                hasMore: node?.hasMore ?? false,
            }
        })
        // Only descendants get sibling-grouping; ancestors typically have one
        // parent per node and don't benefit from collapsing.
        return direction === 'descendants'
            ? groupSiblings(children, path)
            : children
    }

    return recurse(rootId, 'root')
}

function countItems(items: GenealogyItem[]): number {
    let n = 0
    const stack = [...items]
    while (stack.length > 0) {
        const cur = stack.pop()
        if (!cur) continue
        // Synthetic groups don't represent real lineage entries themselves.
        if (!cur.isGroup) n += 1
        stack.push(...cur.items)
    }
    return n
}

/** Collect every tree-item id (both real and synthetic groups) — drives the
 *  default-expanded set for real lineage rows. Groups are explicitly
 *  excluded so they start collapsed. */
function collectExpandedIds(items: GenealogyItem[]): string[] {
    const out: string[] = []
    const stack = [...items]
    while (stack.length > 0) {
        const cur = stack.pop()
        if (!cur) continue
        if (!cur.isGroup) out.push(cur.id)
        stack.push(...cur.items)
    }
    return out
}

/** Styled popover content — header + label/value column grid. */
function NodeTooltipContent({
    fields,
}: { fields: TooltipFields }): React.ReactElement {
    const cls = ['geneal-tooltip']
    if (fields.inactive) cls.push('geneal-tooltip--inactive')
    return (
        <div className={cls.join(' ')}>
            <div className="geneal-tooltip-header">
                <div className="geneal-tooltip-name">{fields.name}</div>
                {fields.category && (
                    <div className="geneal-tooltip-sub">{fields.category}</div>
                )}
                {fields.source && (
                    <div className="geneal-tooltip-sub">{fields.source}</div>
                )}
            </div>
            {fields.note ? (
                <div className="geneal-tooltip-note">{fields.note}</div>
            ) : (
                <dl className="geneal-tooltip-grid">
                    <dt>Quantity</dt>
                    <dd>{fields.quantity}</dd>
                    {fields.consumed && (
                        <>
                            <dt>Consumed</dt>
                            <dd>{fields.consumed}</dd>
                        </>
                    )}
                    {fields.serialNo && (
                        <>
                            <dt>SN</dt>
                            <dd>{fields.serialNo}</dd>
                        </>
                    )}
                    {fields.tare && (
                        <>
                            <dt>Tare</dt>
                            <dd>{fields.tare}</dd>
                        </>
                    )}
                    {fields.address && (
                        <>
                            <dt>Address</dt>
                            <dd>{fields.address}</dd>
                        </>
                    )}
                </dl>
            )}
        </div>
    )
}

interface NodeLabelProps {
    item: GenealogyItem
    onPick?: (itemId: UUID) => void
}

function NodeLabel({ item, onPick }: NodeLabelProps) {
    const cls = ['geneal-node']
    if (item.inactive) cls.push('geneal-node--inactive')
    if (item.isGroup) cls.push('geneal-node--group')
    const Chevron = item.edgeArrow === 'left' ? ChevronLeft : ChevronRight

    const handleClick = (e: React.MouseEvent) => {
        if (!item.itemId || !onPick) return
        e.stopPropagation()
        onPick(item.itemId)
    }

    return (
        <Tooltip
            arrow
            placement="top"
            enterDelay={300}
            title={<NodeTooltipContent fields={item.tooltipFields} />}
            slotProps={{
                tooltip: {
                    sx: {
                        background: 'var(--ink-1)',
                        color: '#fff',
                        maxWidth: 360,
                        p: 1.25,
                        '& .geneal-tooltip-grid dt, & .geneal-tooltip-sub, & .geneal-tooltip-grid dd, & .geneal-tooltip-note, & .geneal-tooltip-name': {
                            color: 'inherit',
                        },
                    },
                },
                arrow: {
                    sx: { color: 'var(--ink-1)' },
                },
            }}
        >
            <span
                className={cls.join(' ')}
                data-node-id={item.id}
                onClick={handleClick}
                onKeyDown={(e) => {
                    if (
                        item.itemId &&
                        onPick &&
                        (e.key === 'Enter' || e.key === ' ')
                    ) {
                        e.preventDefault()
                        onPick(item.itemId)
                    }
                }}
                role={item.itemId ? 'button' : undefined}
                tabIndex={item.itemId ? 0 : undefined}
            >
                {item.originKind && item.originLabel && (
                    <span
                        className={`geneal-edge geneal-edge--${item.originKind} geneal-node-edge`}
                    >
                        <Chevron className="geneal-edge-chevron" />
                        <span className="geneal-edge-source">
                            {item.originLabel}
                        </span>
                    </span>
                )}
                <span className="geneal-node-primary">
                    {item.orderNumber && (
                        <span className="geneal-node-order">
                            {item.orderNumber}
                        </span>
                    )}
                    <span className="geneal-node-name">{item.name}</span>
                    <span className="geneal-node-qty">
                        {' — '}
                        {item.quantityText}
                    </span>
                </span>
                {item.isGroup && item.groupCount != null && (
                    <span className="geneal-node-badge geneal-node-badge--group">
                        × {item.groupCount}
                    </span>
                )}
                {item.hasMore && <span className="geneal-node-more">…</span>}
            </span>
        </Tooltip>
    )
}

function renderTreeItems(
    items: GenealogyItem[],
    onPick?: (itemId: UUID) => void,
): React.ReactNode {
    return items.map((item) => (
        <TreeItem
            key={item.id}
            itemId={item.id}
            label={<NodeLabel item={item} onPick={onPick} />}
        >
            {item.items.length > 0
                ? renderTreeItems(item.items, onPick)
                : null}
        </TreeItem>
    ))
}

export function ItemGenealogyTree({
    itemId,
    onSelect,
}: ItemGenealogyTreeProps) {
    const [depthChoice, setDepthChoice] = useState<DepthChoice>(2)

    if (!itemId || itemId === EMPTY_GUID) {
        return null
    }

    const [[data], loading, error] = useGet<ItemGenealogy>(
        `${Api.items}/${itemId}/genealogy?depth=${depthChoice}`,
        [itemId, depthChoice],
    )

    const {
        ancestorTree,
        descendantTree,
        ancestorCount,
        descendantCount,
        ancestorExpanded,
        descendantExpanded,
    } = useMemo(() => {
        if (!data) {
            return {
                ancestorTree: [] as GenealogyItem[],
                descendantTree: [] as GenealogyItem[],
                ancestorCount: 0,
                descendantCount: 0,
                ancestorExpanded: [] as string[],
                descendantExpanded: [] as string[],
            }
        }
        const byId = new Map<UUID, ItemNode>()
        for (const n of data.nodes) {
            byId.set(n.id, n)
        }
        const ancestors = buildTree(data.rootId, byId, data.edges, 'ancestors')
        const descendants = buildTree(
            data.rootId,
            byId,
            data.edges,
            'descendants',
        )
        return {
            ancestorTree: ancestors,
            descendantTree: descendants,
            ancestorCount: countItems(ancestors),
            descendantCount: countItems(descendants),
            ancestorExpanded: collectExpandedIds(ancestors),
            descendantExpanded: collectExpandedIds(descendants),
        }
    }, [data])

    const depthOptions: DepthChoice[] = [2, 5, 0]
    const depthLabel = (choice: DepthChoice) =>
        choice === 0 ? 'Full' : String(choice)

    return (
        <Box className="geneal-root">
            <Box className="geneal-header">
                <Typography
                    component="h5"
                    className="geneal-title"
                    sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.75,
                        fontSize: 15,
                        fontWeight: 600,
                        m: 0,
                    }}
                >
                    <GenealogyIcon /> Genealogy
                </Typography>
                <Box
                    sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 1,
                    }}
                >
                    {data?.truncated && depthChoice !== 0 && (
                        <Typography
                            variant="caption"
                            title="Some branches are hidden beyond the current depth."
                            sx={{ color: 'var(--sig-warn-deep)' }}
                        >
                            truncated
                        </Typography>
                    )}
                    <Typography
                        variant="caption"
                        sx={{
                            color: 'var(--ink-2)',
                            fontFamily: 'var(--font-mono)',
                            fontSize: 11,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.07em',
                        }}
                    >
                        Depth
                    </Typography>
                    <ToggleButtonGroup
                        value={depthChoice}
                        exclusive
                        size="small"
                        onChange={(_, v) => {
                            if (v != null) setDepthChoice(v as DepthChoice)
                        }}
                    >
                        {depthOptions.map((choice) => (
                            <ToggleButton
                                key={choice}
                                value={choice}
                                title={
                                    choice === 0
                                        ? 'Load the entire tree'
                                        : `Limit to depth ${choice}`
                                }
                                sx={{
                                    px: 1.5,
                                    py: 0.25,
                                    fontSize: 12,
                                    minWidth: 42,
                                }}
                            >
                                {depthLabel(choice)}
                            </ToggleButton>
                        ))}
                    </ToggleButtonGroup>
                </Box>
            </Box>

            {loading && <Loading />}
            {error && (
                <Alert severity="error" sx={{ mb: 1 }}>
                    {String(error)}
                </Alert>
            )}

            {data && (
                <Box className="geneal-grid">
                    <GenealogyPane
                        ariaLabel="Input items"
                        headerLeft="◀ Inputs"
                        count={ancestorCount}
                        tree={ancestorTree}
                        expandedIds={ancestorExpanded}
                        onSelect={onSelect}
                        emptyMessage="No input items recorded."
                    />
                    <GenealogyPane
                        ariaLabel="Output items"
                        headerLeft="Outputs ▶"
                        count={descendantCount}
                        tree={descendantTree}
                        expandedIds={descendantExpanded}
                        onSelect={onSelect}
                        emptyMessage="No output items recorded."
                    />
                </Box>
            )}
        </Box>
    )
}

interface GenealogyPaneProps {
    ariaLabel: string
    headerLeft: string
    count: number
    tree: GenealogyItem[]
    expandedIds: string[]
    emptyMessage: string
    onSelect?: (itemId: UUID) => void
}

function GenealogyPane({
    ariaLabel,
    headerLeft,
    count,
    tree,
    expandedIds,
    emptyMessage,
    onSelect,
}: GenealogyPaneProps) {
    const [expanded, setExpanded] = useState<string[]>(expandedIds)
    // Re-seed when the data behind the tree changes (depth toggle, refetch).
    useEffect(() => {
        setExpanded(expandedIds)
    }, [expandedIds])

    return (
        <Paper
            elevation={0}
            className="geneal-card"
            aria-label={ariaLabel}
            sx={{
                p: 1.25,
                borderRadius: 'var(--r-2)',
                border: '1px solid var(--line)',
                background: 'var(--surface-2)',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <Box className="geneal-card-header">
                <span>{headerLeft}</span>
                <span className="count">
                    {count === 0
                        ? '—'
                        : `${count} item${count === 1 ? '' : 's'}`}
                </span>
            </Box>
            {tree.length === 0 ? (
                <Box className="geneal-empty">{emptyMessage}</Box>
            ) : (
                <SimpleTreeView
                    expandedItems={expanded}
                    onExpandedItemsChange={(_e, ids) => setExpanded(ids)}
                    sx={{
                        '& .MuiTreeItem-content': {
                            py: 0.25,
                            borderRadius: 'var(--r-2)',
                        },
                        '& .MuiTreeItem-content.Mui-focused': {
                            background: 'transparent',
                        },
                        '& .MuiTreeItem-content:hover': {
                            background: 'var(--surface-3, var(--surface))',
                        },
                    }}
                >
                    {renderTreeItems(tree, onSelect)}
                </SimpleTreeView>
            )}
        </Paper>
    )
}

