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
import { formatQuantity, formatUnits } from '@logistics/utils/format'
import { Error as ErrorLabel } from '@progress/kendo-react-labels'
import { Tooltip } from '@progress/kendo-react-tooltip'
import {
    TreeView,
    type TreeViewItemClickEvent,
} from '@progress/kendo-react-treeview'
import type React from 'react'
import { useMemo, useState } from 'react'
import { Diagram3 } from 'react-bootstrap-icons'
import './ItemGenealogyTree.css'

export interface ItemGenealogyTreeProps {
    itemId: UUID
    /** Fired when the user clicks a node. */
    onSelect?: (itemId: UUID) => void
}

type EdgeKind = 'exec' | 'split'

type TreeItem = {
    id: string
    itemId: UUID
    primary: string
    tooltip: string
    inactive: boolean
    isOutput: boolean
    edgeKind?: EdgeKind
    edgeLabel?: string
    edgeArrow: '◀' | '▶'
    expanded: boolean
    items: TreeItem[]
    depth: number
    hasMore: boolean
}

type DepthChoice = 2 | 5 | 0 // 0 = full tree

function nodeName(n: ItemNode): string {
    return (
        n.nomenclatureName ??
        (n.serialNo ? `SN ${n.serialNo}` : `Item ${n.id.slice(0, 8)}`)
    )
}

/**
 * For non-root tree nodes we prefer the edge's consumed quantity: the
 * historical amount that actually flowed along this lineage edge. The live
 * Item.Quantity often drops to 0 after full consumption by the process,
 * which would make the tree misleadingly look empty.
 */
function nodePrimary(n: ItemNode, edge?: GenealogyEdge): string {
    const qty = formatUnits(
        edge ? edge.consumedQuantity : n.quantity,
        n.tareTypeUnits,
        n.nomenclatureCountable,
    )
    return `${nodeName(n)} — ${qty}`
}

function nodeTooltip(n: ItemNode, edge?: GenealogyEdge): string {
    const lines: string[] = [nodeName(n)]
    if (edge) {
        lines.push(
            `Consumed on this edge: ${formatUnits(edge.consumedQuantity, n.tareTypeUnits, n.nomenclatureCountable)}`,
        )
    }
    lines.push(
        `Current quantity: ${formatUnits(n.quantity, n.tareTypeUnits, n.nomenclatureCountable)}`,
    )
    if (n.nomenclatureCategory) {
        lines.push(`Category: ${n.nomenclatureCategory}`)
    }
    if (n.serialNo) {
        lines.push(`SN: ${n.serialNo}`)
    }
    if (n.tareTypeName || n.tareBarcode) {
        const tare = [n.tareTypeName, n.tareBarcode].filter(Boolean).join(' / ')
        lines.push(`Tare: ${tare}`)
    }
    if (n.address != null) {
        lines.push(`Address: ${n.address}`)
    }
    if (n.orderId) {
        lines.push(`Order: ${n.orderId.slice(0, 8)}…`)
    }
    if (n.isOutput) {
        lines.push('Origin: Order execution output')
    }
    if (n.inactive) {
        lines.push('Inactive (completed or deleted)')
    }
    if (edge) {
        const kind = edge.orderProcessId == null ? 'Split' : 'Execution'
        const ptxt = edge.processName ? ` · ${edge.processName}` : ''
        lines.push(`Edge: ${kind}${ptxt}`)
    }
    lines.push(`Id: ${n.id}`)
    return lines.join('\n')
}

function edgeKind(e: GenealogyEdge): EdgeKind {
    return e.orderProcessId == null ? 'split' : 'exec'
}

function edgeLabel(e: GenealogyEdge, countable?: boolean): string {
    const qty = formatQuantity(e.consumedQuantity, countable)
    if (e.orderProcessId == null) {
        return `split · ${qty}`
    }
    return e.processName ? `${e.processName} · ${qty}` : qty
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
    const arrow: '◀' | '▶' = direction === 'ancestors' ? '◀' : '▶'

    function recurse(currentId: UUID, path: string): TreeItem[] {
        const outgoing = byPrimary.get(currentId) ?? []
        return outgoing.map((edge, idx) => {
            const nextId =
                direction === 'ancestors'
                    ? edge.sourceItemId
                    : edge.targetItemId
            const node = nodes.get(nextId)
            const nodeKey = `${path}/${idx}:${nextId}`
            const cycle = visited.has(nextId)
            visited.add(nextId)
            return {
                id: nodeKey,
                itemId: nextId,
                primary: node
                    ? nodePrimary(node, edge)
                    : `(missing ${nextId.slice(0, 8)})`,
                tooltip: node ? nodeTooltip(node, edge) : '',
                inactive: node?.inactive ?? false,
                isOutput: node?.isOutput ?? false,
                edgeKind: edgeKind(edge),
                edgeLabel: edgeLabel(edge, node?.nomenclatureCountable),
                edgeArrow: arrow,
                expanded: true,
                items: cycle ? [] : recurse(nextId, nodeKey),
                depth: node?.depth ?? 0,
                hasMore: node?.hasMore ?? false,
            }
        })
    }

    return recurse(rootId, 'root')
}

function countItems(items: TreeItem[]): number {
    let n = 0
    const stack = [...items]
    while (stack.length > 0) {
        const cur = stack.pop()
        if (!cur) continue
        n += 1
        stack.push(...cur.items)
    }
    return n
}

function renderItem({ item }: { item: TreeItem }): React.ReactElement {
    const cls = ['geneal-node']
    if (item.inactive) cls.push('geneal-node--inactive')

    return (
        <span className={cls.join(' ')} title={item.tooltip}>
            {item.edgeKind && item.edgeLabel && (
                <span
                    className={`geneal-edge geneal-edge--${item.edgeKind} geneal-node-edge`}
                >
                    <span className="arrow">{item.edgeArrow}</span>
                    {/*{item.edgeLabel}*/}
                    &nbsp;
                </span>
            )}
            <span className="geneal-node-primary">{item.primary}</span>
            {item.isOutput && (
                <span
                    className="geneal-node-badge geneal-node-badge--output"
                    title="Order execution output"
                >
                    OUT
                </span>
            )}
            {item.hasMore && (
                <span
                    className="geneal-node-more"
                    title="More links beyond current depth. Increase depth to reveal."
                >
                    …
                </span>
            )}
        </span>
    )
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

    const { ancestorTree, descendantTree, ancestorCount, descendantCount } =
        useMemo(() => {
            if (!data) {
                return {
                    ancestorTree: [] as TreeItem[],
                    descendantTree: [] as TreeItem[],
                    ancestorCount: 0,
                    descendantCount: 0,
                }
            }
            const byId = new Map<UUID, ItemNode>()
            for (const n of data.nodes) {
                byId.set(n.id, n)
            }
            const ancestors = buildTree(
                data.rootId,
                byId,
                data.edges,
                'ancestors',
            )
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
            }
        }, [data])

    const onItemClick = (e: TreeViewItemClickEvent) => {
        const item = e.item as TreeItem
        if (item?.itemId && onSelect) {
            onSelect(item.itemId)
        }
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
