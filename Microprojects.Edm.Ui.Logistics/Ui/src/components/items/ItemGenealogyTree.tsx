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
import { Error as ErrorLabel } from '@progress/kendo-react-labels'
import { Tooltip } from '@progress/kendo-react-tooltip'
import {
    TreeView,
    type TreeViewExpandChangeEvent,
    type TreeViewItemClickEvent,
} from '@progress/kendo-react-treeview'
import type React from 'react'
import { useMemo, useState } from 'react'
import {
    ChevronLeft,
    ChevronRight,
    Diagram3,
} from 'react-bootstrap-icons'
import './ItemGenealogyTree.css'

export interface ItemGenealogyTreeProps {
    itemId: UUID
    /** Fired when the user clicks a node. */
    onSelect?: (itemId: UUID) => void
}

/** Item-origin tokens shown inside the chevron pill. */
type OriginKind = 'out' | 'supply' | 'store' | 'split'
type EdgeArrow = 'left' | 'right'

/** Structured fields rendered inside the Kendo Tooltip popover for a node. */
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

type TreeItem = {
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
    expanded: boolean
    items: TreeItem[]
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

/**
 * Build the structured fields shown inside the styled tooltip. Drops the
 * id, order id, raw "origin/edge" lines and inactive marker — those are
 * already conveyed by the pill, the row styling and the tree itself.
 */
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
function similaritySignature(item: TreeItem): string {
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
function groupSiblings(children: TreeItem[], path: string): TreeItem[] {
    const order: string[] = []
    const buckets = new Map<string, TreeItem[]>()
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
                expanded: false,
                items,
                depth: head.depth,
                hasMore: false,
            } satisfies TreeItem,
        ]
    })
}

/**
 * Walk up/down the edge set from the root, yielding a Kendo TreeView dataset.
 *
 * direction = "ancestors"   → follow TargetItemId == currentId, ascend via SourceItemId.
 * direction = "descendants" → follow SourceItemId == currentId, descend via TargetItemId.
 */
function buildTree(
    rootId: UUID,
    nodes: Map<UUID, ItemNode>,
    edges: GenealogyEdge[],
    direction: 'ancestors' | 'descendants',
): TreeItem[] {
    const byPrimary = new Map<UUID, GenealogyEdge[]>()
    for (const e of edges) {
        const key = direction === 'ancestors' ? e.targetItemId : e.sourceItemId
        const list = byPrimary.get(key) ?? []
        list.push(e)
        byPrimary.set(key, list)
    }

    const visited = new Set<UUID>()
    const arrow: EdgeArrow = direction === 'ancestors' ? 'left' : 'right'

    function recurse(currentId: UUID, path: string): TreeItem[] {
        const outgoing = byPrimary.get(currentId) ?? []
        const children = outgoing.map((edge, idx): TreeItem => {
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
                expanded: true,
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

/**
 * Re-walk the built tree and apply the controlled `expanded` state for
 * group rows. Non-group items stay expanded so their subtrees render
 * naturally without per-row state.
 */
function applyExpansion(
    items: TreeItem[],
    expandedIds: ReadonlySet<string>,
): TreeItem[] {
    return items.map((item) => ({
        ...item,
        expanded: item.isGroup ? expandedIds.has(item.id) : true,
        items: applyExpansion(item.items, expandedIds),
    }))
}

function countItems(items: TreeItem[]): number {
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

/**
 * Walk the built tree and produce a flat lookup from tree-item id to its
 * structured tooltip fields. Used by the Kendo Tooltip content callback,
 * which gets a DOM target rather than a TreeItem instance.
 */
function collectTooltips(items: TreeItem[]): Map<string, TooltipFields> {
    const map = new Map<string, TooltipFields>()
    const stack = [...items]
    while (stack.length > 0) {
        const cur = stack.pop()
        if (!cur) continue
        map.set(cur.id, cur.tooltipFields)
        stack.push(...cur.items)
    }
    return map
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

function renderItem({ item }: { item: TreeItem }): React.ReactElement {
    const cls = ['geneal-node']
    if (item.inactive) cls.push('geneal-node--inactive')
    if (item.isGroup) cls.push('geneal-node--group')

    const Chevron = item.edgeArrow === 'left' ? ChevronLeft : ChevronRight

    // The tree-item id is stamped into `title` so Kendo's parentTitle walker
    // can pick it up from any child hover; the content callback uses it as
    // the lookup key into the tooltip-fields map.
    return (
        <span className={cls.join(' ')} data-node-id={item.id} title={item.id}>
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
    )
}

export function ItemGenealogyTree({
    itemId,
    onSelect,
}: ItemGenealogyTreeProps) {
    const [depthChoice, setDepthChoice] = useState<DepthChoice>(2)
    // Expansion state for synthetic group rows. Real lineage rows always
    // render expanded; only groups need to remember their toggled state.
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
        () => new Set(),
    )

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
        tooltipById,
    } = useMemo(() => {
        if (!data) {
            return {
                ancestorTree: [] as TreeItem[],
                descendantTree: [] as TreeItem[],
                ancestorCount: 0,
                descendantCount: 0,
                tooltipById: new Map<string, TooltipFields>(),
            }
        }
        const byId = new Map<UUID, ItemNode>()
        for (const n of data.nodes) {
            byId.set(n.id, n)
        }
        const ancestors = buildTree(data.rootId, byId, data.edges, 'ancestors')
        const descendants = applyExpansion(
            buildTree(data.rootId, byId, data.edges, 'descendants'),
            expandedGroups,
        )
        const tooltips = new Map<string, TooltipFields>()
        for (const [k, v] of collectTooltips(ancestors)) tooltips.set(k, v)
        for (const [k, v] of collectTooltips(descendants)) tooltips.set(k, v)
        return {
            ancestorTree: ancestors,
            descendantTree: descendants,
            ancestorCount: countItems(ancestors),
            descendantCount: countItems(descendants),
            tooltipById: tooltips,
        }
    }, [data, expandedGroups])

    // Kendo's content prop receives only `{ title }`; we encoded the tree-item
    // id into the title attribute, so a Map lookup hands back the structured
    // fields. Defined as a component so Kendo can mount/unmount it.
    const TooltipContent: React.ComponentType<{ title: string }> = ({
        title,
    }) => {
        const fields = tooltipById.get(title)
        if (!fields) return null
        return <NodeTooltipContent fields={fields} />
    }

    const onItemClick = (e: TreeViewItemClickEvent) => {
        const item = e.item as TreeItem
        if (item?.itemId && onSelect) {
            onSelect(item.itemId)
        }
    }

    const onExpandChange = (e: TreeViewExpandChangeEvent) => {
        const item = e.item as TreeItem
        if (!item?.isGroup) return
        setExpandedGroups((prev) => {
            const next = new Set(prev)
            if (next.has(item.id)) {
                next.delete(item.id)
            } else {
                next.add(item.id)
            }
            return next
        })
    }

    const depthLabel = (choice: DepthChoice): string =>
        choice === 0 ? 'Full' : String(choice)

    const renderDepthButton = (choice: DepthChoice) => (
        <button
            type="button"
            key={choice}
            className={depthChoice === choice ? 'active' : ''}
            onClick={() => setDepthChoice(choice)}
            title={
                choice === 0
                    ? 'Load the entire tree'
                    : `Limit to depth ${choice}`
            }
        >
            {depthLabel(choice)}
        </button>
    )

    return (
        <div className="geneal-root">
            <div className="geneal-header">
                <h5 className="geneal-title">
                    <Diagram3 /> Genealogy
                </h5>
                <div className="geneal-controls">
                    {data?.truncated && depthChoice !== 0 && (
                        <span
                            className="geneal-truncated"
                            title="Some branches are hidden beyond the current depth."
                        >
                            truncated
                        </span>
                    )}
                    <label
                        className="geneal-depth-label"
                        htmlFor="geneal-depth"
                    >
                        Depth
                    </label>
                    <div
                        id="geneal-depth"
                        className="geneal-depth"
                        aria-label="Genealogy depth"
                    >
                        {renderDepthButton(2)}
                        {renderDepthButton(5)}
                        {renderDepthButton(0)}
                    </div>
                </div>
            </div>

            {loading && <Loading />}
            {error && <ErrorLabel>{String(error)}</ErrorLabel>}

            {data && (
                <Tooltip
                    anchorElement="target"
                    position="top"
                    openDelay={300}
                    parentTitle={true}
                    filter={(el: Element) =>
                        el != null && el.closest('[data-node-id]') != null
                    }
                    content={TooltipContent}
                >
                    <div className="geneal-grid">
                        <section
                            className="geneal-card"
                            aria-label="Input items"
                        >
                            <header className="geneal-card-header">
                                <span>◀ Inputs</span>
                                <span className="count">
                                    {ancestorCount === 0
                                        ? '—'
                                        : `${ancestorCount} item${ancestorCount === 1 ? '' : 's'}`}
                                </span>
                            </header>
                            {ancestorTree.length === 0 ? (
                                <div className="geneal-empty">
                                    No input items recorded.
                                </div>
                            ) : (
                                <TreeView
                                    data={ancestorTree}
                                    expandIcons={true}
                                    onItemClick={onItemClick}
                                    onExpandChange={onExpandChange}
                                    item={renderItem}
                                />
                            )}
                        </section>

                        <section
                            className="geneal-card"
                            aria-label="Output items"
                        >
                            <header className="geneal-card-header">
                                <span>Outputs ▶</span>
                                <span className="count">
                                    {descendantCount === 0
                                        ? '—'
                                        : `${descendantCount} item${descendantCount === 1 ? '' : 's'}`}
                                </span>
                            </header>
                            {descendantTree.length === 0 ? (
                                <div className="geneal-empty">
                                    No output items recorded.
                                </div>
                            ) : (
                                <TreeView
                                    data={descendantTree}
                                    expandIcons={true}
                                    onItemClick={onItemClick}
                                    onExpandChange={onExpandChange}
                                    item={renderItem}
                                />
                            )}
                        </section>
                    </div>
                </Tooltip>
            )}
        </div>
    )
}
