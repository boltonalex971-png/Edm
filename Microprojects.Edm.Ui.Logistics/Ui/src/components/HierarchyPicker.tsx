import type { TreeDataItem, UUID } from '@logistics/data/types'
import {
    DropDownTree,
    type DropDownTreeChangeEvent,
} from '@progress/kendo-react-dropdowns'
import type React from 'react'

export function findInHierarchy(
    nodes: TreeDataItem[] | undefined,
    id: UUID | undefined,
): TreeDataItem | null {
    if (!nodes || !id) return null
    for (const n of nodes) {
        if (n.id === id) return n
        const child = findInHierarchy(n.items, id)
        if (child) return child
    }
    return null
}

export type HierarchyPickerProps = {
    data: TreeDataItem[] | undefined
    value: UUID | undefined
    onChange: (value: UUID | undefined) => void
    placeholder?: string
    style?: React.CSSProperties
}

export function HierarchyPicker({
    data,
    value,
    onChange,
    placeholder,
    style,
}: HierarchyPickerProps) {
    return (
        <DropDownTree
            data={data || []}
            dataItemKey="id"
            textField="name"
            subItemsField="items"
            expandField="expanded"
            value={findInHierarchy(data, value)}
            onChange={(e: DropDownTreeChangeEvent) => {
                const sel = e.value as TreeDataItem | null
                if (!sel) {
                    onChange(undefined)
                    return
                }
                if (sel.isFolder) return
                onChange(sel.id as UUID)
            }}
            item={(itemProps: any) => {
                const node = itemProps.item as TreeDataItem
                return node?.isFolder ? (
                    <strong>{node.name}</strong>
                ) : (
                    <span>{node?.name}</span>
                )
            }}
            placeholder={placeholder}
            style={style}
        />
    )
}
