// Wraps the package RelationTable to default the new-row sentinel id to the
// empty Guid (Logistics ids are Guid-typed; the package default of `0` would
// fail model binding on POST). Callers can still override `newId` per-table.
// DateCell/DateTimeCell stay here because date formatting is Logistics-specific.

import {
    RelationTable as PkgRelationTable,
    type RelationTableProps,
} from '@microprojects/edm-components/components/relations/RelationTable'
import { Box } from '@mui/material'
import { EMPTY_GUID } from '@microprojects/edm-components/components/master/MasterDetail'
import { formatLocalDate, formatLocalDateTime } from '../utils/format'

export function RelationTable({ newId = EMPTY_GUID, ...rest }: RelationTableProps) {
    return <PkgRelationTable newId={newId} {...rest} />
}

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
