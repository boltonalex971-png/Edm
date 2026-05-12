import { ParentContext } from '@logistics/components/ParentContext'
import type { DataItem, UUID } from '@logistics/data/types'
import { useContext } from 'react'

interface DetailLinkTextProps {
    onClick: (id: UUID, onUpdate: (dataItem: DataItem) => void) => void
    id: UUID
    text: string
}

export const DetailLinkText = ({ onClick, id, text }: DetailLinkTextProps) => {
    const context = useContext(ParentContext)
    return (
        <span
            style={{ color: 'var(--anchor-color)', cursor: 'pointer' }}
            onClick={() => onClick(id, context.itemUpdate)}
        >
            {text}
        </span>
    )
}
