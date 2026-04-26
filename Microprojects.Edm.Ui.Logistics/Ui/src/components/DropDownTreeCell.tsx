import type { TreeDataItem, UUID } from '@logistics/data/types'
import {
    DropDownTree,
    type DropDownTreeChangeEvent,
} from '@progress/kendo-react-dropdowns'
import type React from 'react'
import { useContext } from 'react'
import { ParentContext } from './ParentContext'

interface DropDownTreeCellProps {
    getData: () => TreeDataItem[] | undefined
    onClick?: (id: UUID, itemUpdate: (item: any) => void) => void
    onChange: Function
    dataItem: any
    field: string
    fieldId: string
    fieldName?: string
    inEdit?: boolean
    editable?: boolean
}

function findById(
    nodes: TreeDataItem[] | undefined,
    id: UUID | undefined,
): TreeDataItem | null {
    if (!nodes || !id) {
        return null
    }
    for (const n of nodes) {
        if (n.id === id) {
            return n
        }
        const child = findById(n.items, id)
        if (child) {
            return child
        }
    }
    return null
}

export const DropDownTreeCell = ({
    getData,
    fieldId,
    fieldName,
    onClick,
    editable = true,
    ...props
}: DropDownTreeCellProps) => {
    const context = useContext(ParentContext)
    const { dataItem, field } = props
    const tree = getData() || []
    const currentId = dataItem[fieldId] as UUID | undefined
    const selected = findById(tree, currentId)

    const handleChange = (e: DropDownTreeChangeEvent): void => {
        const node = e.value as TreeDataItem | null
        if (!node || node.isFolder) {
            return
        }
        props.onChange({
            dataItem,
            field,
            syntheticEvent: e.syntheticEvent,
            value: node.id,
        })
    }

    let content: React.ReactNode
    if (dataItem.inEdit && editable) {
        content = (
            <DropDownTree
                data={tree}
                dataItemKey="id"
                textField="name"
                subItemsField="items"
                expandField="expanded"
                value={selected}
                onChange={handleChange}
                item={(itemProps: any) => {
                    const node = itemProps.item as TreeDataItem | undefined
                    return node?.isFolder ? (
                        <strong>{node.name}</strong>
                    ) : (
                        <span>{node?.name}</span>
                    )
                }}
            />
        )
    } else if (onClick && currentId) {
        const valueName = (fieldName && dataItem[fieldName]) || selected?.name
        content = (
            <a
                style={{ color: 'var(--anchor-color)', cursor: 'pointer' }}
                onClick={() => onClick(currentId, context.itemUpdate)}
            >
                {valueName}
            </a>
        )
    } else {
        const valueName = (fieldName && dataItem[fieldName]) || selected?.name
        content = <span>{valueName}</span>
    }

    return <td style={{ whiteSpace: 'nowrap' }}>{content}</td>
}
