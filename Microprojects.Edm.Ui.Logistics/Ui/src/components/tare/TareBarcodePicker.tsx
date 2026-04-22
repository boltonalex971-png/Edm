import api from '@features/api/api'
import type { TareInfo } from '@logistics/data/types'
import { getData } from '@logistics/hooks/hooks'
import {
    ComboBox,
    type ComboBoxChangeEvent, ComboBoxFilterChangeEvent,
} from '@progress/kendo-react-dropdowns'
import { type CSSProperties, useEffect, useState } from 'react'
import {filterBy, FilterDescriptor} from "@progress/kendo-data-query";

export type TareBarcodeSelection = {
    /** The matched tare when the user picked an existing one. */
    tare?: TareInfo
    /** Current text in the input. When `tare` is undefined and `barcode`
     * is non-empty, the caller should treat this as "create a new tare
     * with this barcode". */
    barcode: string
}

type TareBarcodePickerProps = {
    /** Current selection — pass either the resolved tare or the typed text. */
    value?: TareInfo | string | null
    /** Fires when the user commits a selection or custom value. */
    onChange: (next: TareBarcodeSelection) => void
    /** Optional pre-loaded option list. When omitted the picker self-loads
     * suggestions from `GET /api/logistics/tares/search`. */
    data?: TareInfo[]
    placeholder?: string
    disabled?: boolean
    style?: CSSProperties
    className?: string
}

/**
 * Tare barcode autocomplete — Kendo ComboBox with `allowCustom` so typed
 * values commit on blur / Enter. Kendo handles filtering itself.
 */
export const TareBarcodePicker = ({
    value,
    onChange,
    data,
    placeholder = 'Tare barcode…',
    disabled,
    style,
    className,
}: TareBarcodePickerProps) => {
    const externallyControlled = data !== undefined
    const [loaded, setLoaded] = useState<TareInfo[]>([])

    const [filtered, setData] = useState(loaded.slice());

    const filterData = (filter: FilterDescriptor) => {
        const data = loaded.slice();
        return filterBy(data, filter);
    };

    const filterChange = (event: ComboBoxFilterChangeEvent) => {
        setData(filterData(event.filter));
    };    
    
    useEffect(() => {
        if (externallyControlled) {
            setLoaded(
                data || [],
                // (data ?? []).map((t) => ({
                //     ...t,
                //     barcode: t.barcode ?? '',
                // })),
            )
            return
        }
        
        let cancelled = false;
        (async () => {
            try {
                const found = await getData<TareInfo[]>(
                    `${api.tares}/search?barcode=`,
                )
                if (!cancelled) {
                    setLoaded(
                        found || []
                        // (found ?? []).map((t) => ({
                        //     ...t,
                        //     barcode: t.barcode ?? '',
                        // })),
                    )
                }
            } catch {
                if (!cancelled) setLoaded([])
            }
        })()
        return () => {
            cancelled = true
        }
    }, [data, externallyControlled])

    const handleChange = (e: ComboBoxChangeEvent) => {
        const v = e.value
        if (typeof v === 'string') {
            onChange({ tare: undefined, barcode: v })
        } else if (v && (v as TareInfo).id) {
            const tare = v as TareInfo
            onChange({ tare, barcode: tare.barcode ?? '' })
        } else {
            onChange({ tare: undefined, barcode: '' })
        }
    }

    return (
        <ComboBox
            data={loaded}
            textField="barcode"
            dataItemKey="id"
            allowCustom={true}
            filterable={true}
            onFilterChange={filterChange}
            value={value ?? ''}
            placeholder={placeholder}
            disabled={disabled}
            style={style}
            className={className}
            onChange={handleChange}
        />
    )
}
