import api from '@features/api/api'
import type { AvailableTare, TareInfo, UUID } from '@logistics/data/types'
import { getData } from '@logistics/hooks/hooks'
import { type FilterDescriptor, filterBy } from '@progress/kendo-data-query'
import {
    ComboBox,
    type ComboBoxChangeEvent,
    type ComboBoxFilterChangeEvent,
} from '@progress/kendo-react-dropdowns'
import { type CSSProperties, useEffect, useState } from 'react'

export type TareBarcodeSelection = {
    /** The matched tare when the user picked an existing one. */
    tare?: AvailableTare
    /** Current text in the input. When `tare` is undefined and `barcode`
     * is non-empty, the caller should treat this as "create a new tare
     * with this barcode". */
    barcode: string
}

type TareBarcodePickerProps = {
    /** The currently picked tare (object form). For typed-only custom
     * values pass `null` — Kendo keeps the custom text in its internal
     * state to avoid the value-prop overriding the typed input. */
    value?: AvailableTare | TareInfo | null
    /** Fires on selection or commit of a custom typed value. */
    onChange: (next: AvailableTare) => void
    /** When set, the picker narrows its lookup to tares of this type with
     * available capacity (`/api/logistics/tares/available?tareTypeId=…`).
     * When omitted, the picker lists all tares
     * (`/api/logistics/tares/search`). */
    tareTypeId?: UUID
    /** When true, the dropdown also includes tares with no remaining
     * capacity (e.g. for source-tare lookups in repacking). Defaults to
     * false — only tares with free slots are returned. */
    includeFull?: boolean
    placeholder?: string
    disabled?: boolean
    style?: CSSProperties
    className?: string
}

// Kendo's combobox calls `.toString()` on the textField value when rendering
// the dropdown rows; barcodes can legitimately be null/undefined, so coerce
// to '' to avoid a render crash inside <ListItem>.
const normalise = (t: AvailableTare): AvailableTare => ({
    ...t,
    barcode: t.barcode ?? '',
})

/**
 * Tare barcode autocomplete — Kendo ComboBox with `allowCustom` (typed
 * values commit on blur / Enter) and client-side `filterBy` filtering on
 * the loaded options. Self-loads its own option list based on the
 * optional `tareTypeId` prop.
 */
export const TareBarcodePicker = ({
    value,
    onChange,
    tareTypeId,
    includeFull = false,
    placeholder = 'Tare barcode…',
    disabled,
    style,
    className,
}: TareBarcodePickerProps) => {
    const [loaded, setLoaded] = useState<AvailableTare[]>([])
    const [filtered, setFiltered] = useState<AvailableTare[]>([])
    const [barcode, setBarcode] = useState<string>('')

    useEffect(() => {
        let cancelled = false
        const url = `${api.tares}/available?tareTypeId=${tareTypeId ?? ''}&barcode=${barcode ?? ''}&includeFull=${includeFull}`;
        (async () => {
            try {
                const found = await getData<AvailableTare[]>(url)
                if (cancelled) return
                const normed = (found ?? []).map(normalise)
                setLoaded(normed)
                setFiltered(normed)
            } catch {
                if (!cancelled) {
                    setLoaded([])
                    setFiltered([])
                }
            }
        })()
        return () => {
            cancelled = true
        }
    }, [tareTypeId, barcode, includeFull])

    const onFilterChange = (e: ComboBoxFilterChangeEvent) => {
        const bc = e.filter.value
        if (!barcode || !bc.startsWith(barcode)){
            setBarcode(bc)
            return
        }
        
        setFiltered(filterBy(loaded.slice(), e.filter as FilterDescriptor))
    }

    const handleChange = (e: ComboBoxChangeEvent) => {
        let tare = e.value
        onChange(tare)
    }

    return (
        <ComboBox
            data={filtered}
            textField="barcode"
            dataItemKey="id"
            allowCustom={true}
            filterable={true}
            onFilterChange={onFilterChange}
            // Pass the object (or null) only — never a string. Feeding a
            // typed string back through `value` makes Kendo treat it as
            // an "external value change" and resets the input on blur,
            // which is what was making the custom value disappear.
            value={value && !value?.id ? {...value, id: ''} : value}
            placeholder={placeholder}
            disabled={disabled}
            style={style}
            className={className}
            onChange={handleChange}
        />
    )
}
