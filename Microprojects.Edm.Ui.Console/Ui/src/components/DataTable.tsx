import { Box } from '@mui/material'
import type { ReactNode } from 'react'

export interface DataTableColumn<T> {
    key: string
    header: string
    width?: string
    align?: 'left' | 'right' | 'center'
    render: (row: T) => ReactNode
}

interface DataTableProps<T> {
    columns: DataTableColumn<T>[]
    rows: T[]
    rowKey: (row: T) => string
    selectedKey?: string
    onSelect?: (key: string) => void
    emptyMessage?: string
}

// Hand-styled table per the handoff's data-row pattern (components.html CMP-09):
// 40px row height, --surface-2 header with mono eyebrow caps, hover --surface-2,
// selection treatment uses an inset 3px accent left bar (the design system's
// rule against full-row color fills).
export function DataTable<T>({
    columns,
    rows,
    rowKey,
    selectedKey,
    onSelect,
    emptyMessage = 'No items.',
}: DataTableProps<T>) {
    if (rows.length === 0) {
        return <Box className="data-table-empty">{emptyMessage}</Box>
    }

    return (
        <Box className="data-table" role="table">
            <Box className="data-table-head" role="row">
                {columns.map((col) => (
                    <Box
                        key={col.key}
                        className="cell head"
                        role="columnheader"
                        sx={{
                            flex: col.width ? `0 0 ${col.width}` : 1,
                            textAlign: col.align ?? 'left',
                        }}
                    >
                        {col.header}
                    </Box>
                ))}
            </Box>
            {rows.map((row) => {
                const key = rowKey(row)
                const selected = key === selectedKey
                return (
                    <Box
                        key={key}
                        role="row"
                        className={`data-table-row${selected ? ' selected' : ''}${onSelect ? ' clickable' : ''}`}
                        onClick={onSelect ? () => onSelect(key) : undefined}
                    >
                        {columns.map((col) => (
                            <Box
                                key={col.key}
                                className="cell"
                                role="cell"
                                sx={{
                                    flex: col.width ? `0 0 ${col.width}` : 1,
                                    textAlign: col.align ?? 'left',
                                }}
                            >
                                {col.render(row)}
                            </Box>
                        ))}
                    </Box>
                )
            })}
        </Box>
    )
}
