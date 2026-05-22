import type { TreeDataItem, UUID } from '@logistics/data/types'
import { HierarchyPicker } from '@microprojects/edm-components/components/forms/HierarchyPicker'
import { Box, Link } from '@mui/material'
import { useContext } from 'react'
import { ParentContext } from '@microprojects/edm-components/components/master/ParentContext'

interface DropDownTreeCellProps {
    getData: () => TreeDataItem[] | undefined
    onClick?: (id: UUID, itemUpdate: (item: any) => void) => void
    onChange: (e: { dataItem: any; field: string; value: UUID }) => void
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
    if (!nodes || !id) return null
    for (const n of nodes) {
        if (n.id === id) return n
        const child = findById(n.items, id)
        if (child) return child
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
    const { dataItem, field, inEdit } = props
    const tree = getData()
    const currentId = dataItem[fieldId] as UUID | undefined
    const selected = findById(tree, currentId)

    if (inEdit && editable) {
        return (
            <HierarchyPicker
                data={tree}
                value={currentId}
                onChange={(id) =>
                    props.onChange({ dataItem, field, value: id as UUID })
                }
            />
        )
    }
    const valueName = (fieldName && dataItem[fieldName]) || selected?.name
    if (onClick && currentId) {
        return (
            <Link
                component="button"
                underline="hover"
                onClick={() => onClick(currentId, context.itemUpdate)}
                sx={{ color: 'var(--accent)', cursor: 'pointer', font: 'inherit' }}
            >
                {valueName}
            </Link>
        )
    }
    return (
        <Box sx={{ whiteSpace: 'nowrap', color: 'var(--ink-2)' }}>{valueName}</Box>
    )
}
