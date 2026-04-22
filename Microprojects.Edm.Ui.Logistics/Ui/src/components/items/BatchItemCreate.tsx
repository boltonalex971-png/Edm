import Api from '@features/api/api'
import { Loading } from '@features/utils/Utils'
import { LinkableComboBox } from '@logistics/components/DropDowns'
import { TareBarcodePicker } from '@logistics/components/tare/TareBarcodePicker'
import type {
    AvailableTare,
    BatchCreateItemRequest,
    BatchCreateItemResult,
    Nomenclature,
    TareInfo,
    TareType,
    UUID,
} from '@logistics/data/types'
import { useGet } from '@logistics/hooks/hooks'
import { Button } from '@progress/kendo-react-buttons'
import { NumericTextBox } from '@progress/kendo-react-inputs'
import axios from 'axios'
import React, { useEffect, useMemo, useState } from 'react'
import { Alert } from 'reactstrap'

type BatchItemCreateProps = {
    supplyId?: UUID
    onCreated?: (result: BatchCreateItemResult) => void
    onClose?: () => void
}

export function BatchItemCreate({
    supplyId,
    onCreated,
    onClose,
}: BatchItemCreateProps) {
    const [[nomenclatures]] = useGet<Nomenclature[]>(Api.nomenclatures, [])
    const [[tareTypes]] = useGet<TareType[]>(Api.taretypes, [])

    const [nomenclatureId, setNomenclatureId] = useState<UUID>()
    const [tareTypeId, setTareTypeId] = useState<UUID>()
    const [selectedTare, setSelectedTare] = useState<AvailableTare | null>(null)
    const [barcodeText, setBarcodeText] = useState('')
    // Quantity stays empty until a Tare Type is chosen — there is no
    // meaningful default before then.
    const [quantity, setQuantity] = useState<number | undefined>(undefined)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string>()
    const [result, setResult] = useState<BatchCreateItemResult>()

    const selectedNomenclature = nomenclatures?.find(
        (n) => n.id === nomenclatureId,
    )
    const selectedTareType = tareTypes?.find((t) => t.id === tareTypeId)

    useEffect(() => {
        if (selectedNomenclature?.defaultTareTypeId) {
            setTareTypeId(selectedNomenclature.defaultTareTypeId)
        }
    }, [selectedNomenclature?.defaultTareTypeId])

    const [[availableTares], taresLoading] = useGet<AvailableTare[]>(
        `${Api.tares}/available?tareTypeId=${tareTypeId || ''}`,
        [tareTypeId],
    )

    // Normalise so the barcode-textfield ComboBox never sees an undefined
    // `barcode` (Kendo calls .toString() on it and crashes).
    const tareOptions = useMemo(
        () =>
            (availableTares ?? []).map((t) => ({
                ...t,
                barcode: t.barcode ?? '',
            })),
        [availableTares],
    )

    useEffect(() => {
        setSelectedTare(null)
        setBarcodeText('')
    }, [tareTypeId])

    // If no existing tare selected, the backend will create a new tare.
    // Barcode may be empty => create tare without barcode.
    const isNewTare = !selectedTare
    const maxQuantity = useMemo(() => {
        if (selectedTare) {
            return selectedTare.remaining
        }
        if (isNewTare && selectedTareType) {
            return selectedTareType.capacity
        }
        return 0
    }, [selectedTare, isNewTare, selectedTareType])

    // Default the quantity to the tare's max capacity whenever that max
    // changes (tare type picked, existing tare selected, etc). Reset to
    // undefined when no Tare Type is selected so the field appears empty.
    const isCountable = selectedNomenclature?.countable ?? false
    useEffect(() => {
        if (!tareTypeId) {
            setQuantity(undefined)
            return
        }
        if (maxQuantity > 0) {
            setQuantity(isCountable ? Math.floor(maxQuantity) : maxQuantity)
        }
    }, [tareTypeId, maxQuantity, isCountable])

    const canSubmit =
        nomenclatureId &&
        tareTypeId &&
        quantity !== undefined &&
        quantity > 0 &&
        quantity <= maxQuantity &&
        !loading

    const handleSubmit = async () => {
        if (!canSubmit) return
        setLoading(true)
        setError(undefined)
        setResult(undefined)

        const body: BatchCreateItemRequest = {
            nomenclatureId: nomenclatureId!,
            tareTypeId: tareTypeId!,
            tareId: selectedTare?.id,
            barcode: selectedTare ? undefined : barcodeText || undefined,
            quantity: quantity!,
            supplyId,
        }

        try {
            const response = await axios.post<BatchCreateItemResult>(
                `${Api.items}/batch`,
                body,
            )
            setResult(response.data)
            onCreated?.(response.data)
        } catch (e: any) {
            setError(e.response?.data?.detail || e.message || 'Error')
        } finally {
            setLoading(false)
        }
    }

    if (result) {
        return (
            <div className="p-3">
                <Alert color="success" fade>
                    <strong>Created {result.createdCount} item(s)</strong> in
                    tare <strong>{result.tareBarcode || '(no barcode)'}</strong>{' '}
                    ({result.tareTypeName}).
                    {result.remaining > 0 && (
                        <> Remaining capacity: {result.remaining}.</>
                    )}
                </Alert>
                <div
                    className="mt-2"
                    style={{ display: 'flex', gap: '0.5rem' }}
                >
                    <Button
                        themeColor="primary"
                        onClick={() => {
                            setResult(undefined)
                            setQuantity(undefined)
                        }}
                    >
                        Create more
                    </Button>
                    {onClose && <Button onClick={onClose}>Close</Button>}
                </div>
            </div>
        )
    }

    return (
        <div className="p-3">
            <h6>Batch Create Items</h6>
            {error && (
                <Alert color="danger" fade>
                    {error}
                </Alert>
            )}

            <div className="mb-2">
                <label className="k-label">Nomenclature</label>
                <LinkableComboBox
                    data={nomenclatures}
                    value={nomenclatureId}
                    onChange={(e) => setNomenclatureId(e.value?.id)}
                />
            </div>

            <div className="mb-2">
                <label className="k-label">Tare Type</label>
                <LinkableComboBox
                    data={tareTypes}
                    value={tareTypeId}
                    onChange={(e) => setTareTypeId(e.value?.id)}
                />
            </div>

            <div className="mb-2">
                <label className="k-label">
                    Tare Barcode
                    {taresLoading && <span className="ms-2">(loading...)</span>}
                </label>
                <TareBarcodePicker
                    //data={tareOptions as unknown as TareInfo[]}
                    
                    value={selectedTare ?? barcodeText}
                    onChange={({ tare, barcode }) => {
                        if (tare) {
                            // Re-anchor to the AvailableTare row so the
                            // remaining-capacity logic keeps working.
                            const match = tareOptions.find(
                                (t) => t.id === tare.id,
                            )
                            setSelectedTare(match ?? null)
                            setBarcodeText(barcode)
                        } else {
                            setSelectedTare(null)
                            setBarcodeText(barcode)
                        }
                    }}
                    placeholder="Select existing, type new, or leave empty"
                />
                {selectedTare && (
                    <small className="text-muted">
                        Existing tare &mdash; remaining:{' '}
                        {selectedTare.remaining}
                    </small>
                )}
                {isNewTare && (
                    <small className="text-muted">
                        New tare will be created
                        {barcodeText
                            ? ` with barcode “${barcodeText}”`
                            : ' without barcode'}
                        .
                    </small>
                )}
            </div>

            <div className="mb-2" style={{ maxWidth: '200px' }}>
                <label className="k-label">
                    {isCountable ? 'Number of items' : 'Quantity'}
                </label>
                <NumericTextBox
                    value={quantity}
                    disabled={!tareTypeId}
                    min={isCountable ? 1 : 0.001}
                    max={maxQuantity > 0 ? maxQuantity : undefined}
                    step={isCountable ? 1 : 0.1}
                    format={isCountable ? 'n0' : 'n3'}
                    onChange={(e) => {
                        const v = e.value
                        if (v == null) {
                            setQuantity(undefined)
                            return
                        }
                        setQuantity(isCountable ? Math.round(v) : v)
                    }}
                />
                {maxQuantity > 0 && (
                    <small className="text-muted">Max: {maxQuantity}</small>
                )}
            </div>

            <div className="mt-3" style={{ display: 'flex', gap: '0.5rem' }}>
                <Button
                    themeColor="primary"
                    disabled={!canSubmit}
                    onClick={handleSubmit}
                >
                    {loading ? 'Creating...' : 'Create'}
                </Button>
                {onClose && <Button onClick={onClose}>Cancel</Button>}
            </div>
            {loading && <Loading />}
        </div>
    )
}
