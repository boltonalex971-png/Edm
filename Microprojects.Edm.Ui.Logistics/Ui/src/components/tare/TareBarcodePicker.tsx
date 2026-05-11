import api from '@features/api/api'
import type { AvailableTare, TareInfo, UUID } from '@logistics/data/types'
import { getData } from '@logistics/hooks/hooks'
import { formatUnits } from '@logistics/utils/format'
import { Autocomplete, Box, TextField, Typography } from '@mui/material'
import {
    type CSSProperties,
    type SyntheticEvent,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'

export type TareBarcodeSelection = {
    /** The matched tare when the user picked an existing one. */
    tare?: AvailableTare
    /** Current text in the input. When `tare` is undefined and `barcode`
     * is non-empty, the caller should treat this as "create a new tare
     * with this barcode". */
    barcode: string
}

type TareBarcodePickerProps = {
    /** The currently picked tare. `null`/`{id:'',…}` means typed-only or empty. */
    value?: AvailableTare | TareInfo | null
    /** Fires on selection or commit of a custom typed value. Always receives
     *  an AvailableTare-shaped object — `{id, barcode, …}` for existing picks
     *  and `{id:'', barcode:typed}` for typed-only commits. */
    onChange: (next: AvailableTare) => void
    /** When set, the picker narrows its lookup to tares of this type with
     * available capacity (`/api/logistics/tares/available?tareTypeId=…`).
     * When omitted, the picker lists all tares
     * (`/api/logistics/tares/search`). */
    tareTypeId?: UUID
    /** When set and `tareTypeId` is not, narrows the lookup to tares whose
     * type is in the nomenclature's AllowedTareTypes list. Ignored when
     * `tareTypeId` is set (the explicit type already pins the result). */
    nomenclatureId?: UUID
    /** When true, the dropdown also includes tares with no remaining
     * capacity (e.g. for source-tare lookups in repacking). Defaults to
     * false — only tares with free slots are returned. */
    includeFull?: boolean
    placeholder?: string
    disabled?: boolean
    style?: CSSProperties
    className?: string
}

type PickerOption = AvailableTare & { __barcode: string }

const toOption = (t: AvailableTare): PickerOption => ({
    ...t,
    __barcode: t.barcode ?? '',
})

// Reasonable initial width before any options are loaded — wide enough for
// a typical 10–14-char alphanumeric barcode in mono 13px.
const INITIAL_INPUT_PX = 200
// Chrome around the input: clear icon + dropdown arrow + horizontal padding.
const INPUT_CHROME_PX = 56
// Right-side free-slots badge (matches `minWidth: 76` in renderOption + gap).
const BADGE_PX = 86
// Row paddings (li `px: 2` from MUI default + the flex gap of 8px).
const ROW_PADDING_PX = 40

// Canvas text measurement for auto-sizing — same pattern as HierarchyPicker.
let _measureCtx: CanvasRenderingContext2D | null | undefined
function getMeasureCtx(): CanvasRenderingContext2D | null {
    if (_measureCtx === undefined) {
        try {
            _measureCtx = document.createElement('canvas').getContext('2d')
        } catch {
            _measureCtx = null
        }
    }
    return _measureCtx ?? null
}

function buildFont(
    family: string,
    weight: number,
    sizePx: number,
): string {
    return `${weight} ${sizePx}px ${family}`
}

interface RowMeasurements {
    /** Widest barcode label (mono). Drives the input's auto-size. */
    barcodePx: number
    /** Widest left-column row content (max of barcode line + caption line). */
    leftPx: number
}

function measureOptions(
    opts: PickerOption[],
    monoFamily: string,
    captionFamily: string,
): RowMeasurements {
    if (opts.length === 0) return { barcodePx: 0, leftPx: 0 }
    const ctx = getMeasureCtx()
    if (!ctx) return { barcodePx: 0, leftPx: 0 }
    const monoFont = buildFont(monoFamily, 500, 13)
    const captionFont = buildFont(captionFamily, 400, 12)
    let barcodePx = 0
    let leftPx = 0
    for (const o of opts) {
        ctx.font = monoFont
        const bw = ctx.measureText(o.__barcode || '(no barcode)').width
        if (bw > barcodePx) barcodePx = bw
        let captionPx = 0
        if (o.tareTypeName) {
            const captionParts = [o.tareTypeName]
            if (o.capacity > 0) {
                captionParts.push(
                    formatUnits(
                        o.capacity,
                        o.tareTypeUnits,
                        (o.sizeX ?? 0) > 0,
                    ),
                )
            }
            ctx.font = captionFont
            captionPx = ctx.measureText(captionParts.join(' · ')).width
        }
        const left = Math.max(bw, captionPx)
        if (left > leftPx) leftPx = left
    }
    return { barcodePx, leftPx }
}

/**
 * Tare barcode autocomplete — MUI Autocomplete with `freeSolo` (typed
 * values commit on Enter or blur) plus a server-fed option list. The
 * server query is re-issued only when the typed text doesn't extend the
 * previous query, mirroring the previous Kendo implementation's
 * server-vs-client filter split. Input width auto-sizes to fit the
 * widest barcode in the loaded set; popup width auto-sizes to fit the
 * widest full row including the free-slots badge.
 */
export const TareBarcodePicker = ({
    value,
    onChange,
    tareTypeId,
    nomenclatureId,
    includeFull = false,
    placeholder = 'Tare barcode…',
    disabled,
    style,
    className,
}: TareBarcodePickerProps) => {
    const [options, setOptions] = useState<PickerOption[]>([])
    const [serverQuery, setServerQuery] = useState<string>('')
    const [inputValue, setInputValue] = useState<string>(value?.barcode ?? '')
    const lastCommittedRef = useRef<string>(value?.barcode ?? '')
    const wrapperRef = useRef<HTMLDivElement>(null)
    const [inputPx, setInputPx] = useState<number>(INITIAL_INPUT_PX)
    const [popupPx, setPopupPx] = useState<number>(INITIAL_INPUT_PX)

    // External value changes (parent setState after onChange, or initial
    // mount with a preloaded value) re-sync the visible text. Skipped when
    // the change matches our last committed value so the user's in-flight
    // typing isn't clobbered.
    useEffect(() => {
        const v = value?.barcode ?? ''
        if (v !== lastCommittedRef.current) {
            lastCommittedRef.current = v
            setInputValue(v)
        }
    }, [value?.barcode])

    useEffect(() => {
        let cancelled = false
        const url = `${api.tares}/available?tareTypeId=${tareTypeId ?? ''}&nomenclatureId=${nomenclatureId ?? ''}&barcode=${serverQuery ?? ''}&includeFull=${includeFull}`
        ;(async () => {
            try {
                const found = await getData<AvailableTare[]>(url)
                if (cancelled) return
                setOptions((found ?? []).map(toOption))
            } catch {
                if (!cancelled) setOptions([])
            }
        })()
        return () => {
            cancelled = true
        }
    }, [tareTypeId, nomenclatureId, serverQuery, includeFull])

    // Auto-size: re-measure on every options change, using the wrapper's
    // computed font families (theme + browser size aware). Initial width
    // stays in place when options are empty so the picker doesn't collapse
    // back to a tiny size between queries.
    useEffect(() => {
        if (options.length === 0) return
        const computed = wrapperRef.current
            ? window.getComputedStyle(wrapperRef.current)
            : null
        const monoFamily =
            (computed?.getPropertyValue('--font-mono') || '').trim() ||
            'monospace'
        const captionFamily =
            computed?.fontFamily || 'sans-serif'
        const { barcodePx, leftPx } = measureOptions(
            options,
            monoFamily,
            captionFamily,
        )
        if (barcodePx > 0) {
            setInputPx(
                Math.max(
                    INITIAL_INPUT_PX,
                    Math.ceil(barcodePx + INPUT_CHROME_PX),
                ),
            )
        }
        if (leftPx > 0) {
            setPopupPx(
                Math.max(
                    INITIAL_INPUT_PX,
                    Math.ceil(leftPx + BADGE_PX + ROW_PADDING_PX),
                ),
            )
        }
    }, [options])

    // Client-side narrow within the loaded set so typing past the current
    // server query stays responsive. Substring match keeps the UX parity
    // with Kendo's contains-filter default.
    const filtered = useMemo(() => {
        const q = inputValue.trim().toLowerCase()
        if (!q) return options
        return options.filter((o) => o.__barcode.toLowerCase().includes(q))
    }, [options, inputValue])

    const handleInputChange = (
        _e: SyntheticEvent,
        next: string,
        reason: string,
    ) => {
        if (reason === 'reset') return
        setInputValue(next)
        // Server re-fetch only when the new query doesn't extend the
        // previous one — typing one more char keeps the existing options
        // and narrows client-side.
        if (!serverQuery || !next.startsWith(serverQuery)) {
            setServerQuery(next)
        }
    }

    const handleChange = (
        _e: SyntheticEvent,
        next: PickerOption | string | null,
    ) => {
        if (next == null) {
            lastCommittedRef.current = ''
            onChange({ id: '', barcode: '' } as unknown as AvailableTare)
            return
        }
        if (typeof next === 'string') {
            // freeSolo commit (Enter / blur on typed text)
            lastCommittedRef.current = next
            onChange({ id: '', barcode: next } as unknown as AvailableTare)
            return
        }
        // Existing tare picked from the dropdown
        const picked: AvailableTare = {
            ...next,
            barcode: next.__barcode,
        }
        lastCommittedRef.current = picked.barcode
        onChange(picked)
    }

    const handleBlur = () => {
        // Commit typed-only text on blur so freeSolo selections survive
        // even when the user tabs out without pressing Enter.
        if (inputValue !== lastCommittedRef.current) {
            const next = inputValue
            lastCommittedRef.current = next
            onChange({ id: '', barcode: next } as unknown as AvailableTare)
        }
    }

    const autocompleteValue: PickerOption | null = value?.id
        ? toOption(value as AvailableTare)
        : null

    // Caller-provided width (style.width / props.style) wins so toolbar
    // layouts can still pin a fixed size; otherwise the measured input width
    // applies as the actual width (display: inline-block) so the picker
    // doesn't stretch to fill its parent grid cell.
    const wrapperStyle: CSSProperties = useMemo(() => {
        const hasCallerWidth = style && (style as any).width != null
        return hasCallerWidth
            ? { display: 'inline-block', ...style }
            : { display: 'inline-block', width: inputPx, ...style }
    }, [style, inputPx])

    return (
        <Box ref={wrapperRef} style={wrapperStyle}>
            <Autocomplete
                freeSolo
                forcePopupIcon
                options={filtered}
                value={autocompleteValue}
                inputValue={inputValue}
                disabled={disabled}
                disableClearable={false}
                className={className}
                size="small"
                fullWidth
                filterOptions={(x) => x}
                getOptionLabel={(o) =>
                    typeof o === 'string' ? o : (o.__barcode ?? '')
                }
                isOptionEqualToValue={(o, v) =>
                    typeof o === 'object' &&
                    typeof v === 'object' &&
                    o.id === v.id
                }
                slotProps={{
                    popper: {
                        placement: 'bottom-start',
                        sx: { width: `${popupPx}px !important` },
                        modifiers: [
                            {
                                // Pin popup's left edge to anchor's left
                                // edge — MUI Autocomplete's default popper
                                // can shift horizontally when the popup is
                                // wider than the input; this keeps the
                                // alignment regardless of width.
                                name: 'flip',
                                options: {
                                    fallbackPlacements: ['top-start'],
                                },
                            },
                            {
                                name: 'preventOverflow',
                                options: {
                                    boundary: 'viewport',
                                    padding: 8,
                                    altAxis: false,
                                },
                            },
                        ],
                    },
                    paper: {
                        sx: {
                            maxHeight: 'min(60vh, 480px)',
                            border: '1px solid var(--line-strong)',
                            boxShadow: 'var(--elev-2)',
                        },
                    },
                }}
                renderOption={(props, option) => {
                    const remaining = option.remaining
                    const capacity = option.capacity
                    const units = option.tareTypeUnits
                    // Countable when sizeX is set (matches ItemDetail's
                    // heuristic) — used to format the remaining figure as
                    // integer vs decimal so the picker matches the rest of
                    // the UI.
                    const countable = (option.sizeX ?? 0) > 0
                    const isFull = remaining != null && remaining <= 0
                    const isLow =
                        !isFull &&
                        remaining != null &&
                        capacity > 0 &&
                        remaining / capacity < 0.15
                    const tone = isFull
                        ? {
                              bg: 'var(--surface-2)',
                              fg: 'var(--ink-3)',
                              border: 'var(--line-strong)',
                          }
                        : isLow
                          ? {
                                bg: 'var(--sig-warn-soft)',
                                fg: 'var(--sig-warn-deep)',
                                border: 'var(--sig-warn-deep)',
                            }
                          : {
                                bg: 'var(--sig-run-soft)',
                                fg: 'var(--sig-run-deep)',
                                border: 'var(--sig-run-deep)',
                            }
                    return (
                        <Box
                            component="li"
                            {...props}
                            key={option.id}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                            }}
                        >
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                                <Typography
                                    sx={{
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: 13,
                                        fontWeight: 500,
                                        color: 'var(--ink-1)',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {option.__barcode || '(no barcode)'}
                                </Typography>
                                {option.tareTypeName && (
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            display: 'block',
                                            color: 'var(--ink-3)',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {option.tareTypeName}
                                        {capacity > 0 && (
                                            <>
                                                {' · '}
                                                {formatUnits(
                                                    capacity,
                                                    units,
                                                    countable,
                                                )}
                                            </>
                                        )}
                                    </Typography>
                                )}
                            </Box>
                            {remaining != null && (
                                <Box
                                    sx={{
                                        flex: '0 0 auto',
                                        textAlign: 'right',
                                        px: 1,
                                        py: 0.25,
                                        borderRadius: 'var(--r-2)',
                                        background: tone.bg,
                                        border: `1px solid ${tone.border}`,
                                        color: tone.fg,
                                        minWidth: 76,
                                    }}
                                >
                                    <Typography
                                        sx={{
                                            fontFamily: 'var(--font-mono)',
                                            fontSize: 13,
                                            fontWeight: 700,
                                            lineHeight: 1.1,
                                        }}
                                    >
                                        {formatUnits(
                                            remaining,
                                            units,
                                            countable,
                                        )}
                                    </Typography>
                                    <Typography
                                        sx={{
                                            fontFamily: 'var(--font-mono)',
                                            fontSize: 9.5,
                                            fontWeight: 700,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.07em',
                                            opacity: 0.85,
                                            lineHeight: 1.1,
                                        }}
                                    >
                                        {isFull ? 'full' : 'free'}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    )
                }}
                onInputChange={handleInputChange}
                onChange={handleChange}
                onBlur={handleBlur}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        placeholder={placeholder}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                background: 'var(--surface)',
                                fontFamily: 'var(--font-mono)',
                                fontSize: 13,
                                minHeight: 'var(--field-h)',
                            },
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'var(--line-strong)',
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'var(--ink-3)',
                            },
                        }}
                    />
                )}
            />
        </Box>
    )
}
