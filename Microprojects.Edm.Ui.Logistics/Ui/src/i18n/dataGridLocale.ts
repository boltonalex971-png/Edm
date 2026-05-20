import { enUS, ruRU } from '@mui/x-data-grid/locales'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

const TABLE = {
    en: enUS,
    ru: ruRU,
} as const

// MUI X v8's ruRU pack ships `paginationDisplayedRows` commented out, so the
// footer's "of N" half stays English unless we patch it in.
const PAGINATION_DISPLAYED_ROWS_PATCH: Partial<
    Record<keyof typeof TABLE, (p: { from: number; to: number; count: number; estimated?: number }) => string>
> = {
    ru: ({ from, to, count, estimated }) => {
        if (!estimated) {
            return `${from}–${to} из ${count !== -1 ? count : `более ${to}`}`
        }
        const estimatedLabel = estimated && estimated > to ? `около ${estimated}` : `более ${to}`
        return `${from}–${to} из ${count !== -1 ? count : estimatedLabel}`
    },
}

export function useDataGridLocaleText() {
    const { i18n } = useTranslation()
    return useMemo(() => {
        const lng = (i18n.language || 'en') as keyof typeof TABLE
        const key: keyof typeof TABLE =
            lng in TABLE
                ? lng
                : (lng.split('-')[0] as keyof typeof TABLE) in TABLE
                  ? (lng.split('-')[0] as keyof typeof TABLE)
                  : 'en'
        const base = TABLE[key].components.MuiDataGrid.defaultProps.localeText
        const patch = PAGINATION_DISPLAYED_ROWS_PATCH[key]
        return patch ? { ...base, paginationDisplayedRows: patch } : base
    }, [i18n.language])
}
