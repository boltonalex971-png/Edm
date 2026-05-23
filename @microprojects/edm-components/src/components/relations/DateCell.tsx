import {Box} from '@mui/material'
import {formatLocalDate} from '../../utils/dates'

interface DateCellProps {
    value?: any
    dataItem?: any
    field?: string
}

export const DateCell = (p: DateCellProps) => {
    const v = p.value ?? (p.field ? p.dataItem?.[p.field] : undefined)
    return <Box sx={{color: 'var(--ink-2)'}}>{formatLocalDate(v)}</Box>
}
