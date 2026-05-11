// Re-export of the package RelationTable; DateCell/DateTimeCell stay here because date formatting is Logistics-specific.

import { Box } from '@mui/material'
import { formatLocalDate, formatLocalDateTime } from '../utils/format'

export { RelationTable } from '@microprojects/edm-components/components/relations/RelationTable'

interface DateCellLikeProps {
    value?: any
    dataItem?: any
    field?: string
}

export const DateCell = (p: DateCellLikeProps) => {
    const v = p.value ?? (p.field ? p.dataItem?.[p.field] : undefined)
    return <Box sx={{ color: 'var(--ink-2)' }}>{formatLocalDate(v)}</Box>
}

export const DateTimeCell = (p: DateCellLikeProps) => {
    const v = p.value ?? (p.field ? p.dataItem?.[p.field] : undefined)
    return <Box sx={{ color: 'var(--ink-2)' }}>{formatLocalDateTime(v)}</Box>
}
