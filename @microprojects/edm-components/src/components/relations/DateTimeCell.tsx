import {Box} from '@mui/material'
import {formatLocalDateTime} from '../../utils/dates'

interface DateTimeCellProps {
    value?: any
    dataItem?: any
    field?: string
}

export const DateTimeCell = (p: DateTimeCellProps) => {
    const v = p.value ?? (p.field ? p.dataItem?.[p.field] : undefined)
    return <Box sx={{color: 'var(--ink-2)'}}>{formatLocalDateTime(v)}</Box>
}
