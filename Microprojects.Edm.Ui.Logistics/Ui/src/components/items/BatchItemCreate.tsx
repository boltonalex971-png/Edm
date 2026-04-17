import React, {useEffect, useMemo, useState} from 'react'
import axios from 'axios'
import {ComboBox, type ComboBoxChangeEvent} from '@progress/kendo-react-dropdowns'
import {NumericTextBox} from '@progress/kendo-react-inputs'
import {Button} from '@progress/kendo-react-buttons'
import {Alert} from 'reactstrap'
import Api from '@features/api/api'
import {useGet} from '@logistics/hooks/hooks'
import type {
    AvailableTare,
    BatchCreateItemRequest,
    BatchCreateItemResult,
    Nomenclature,
    TareType,
    UUID,
} from '@logistics/data/types'
import {LinkableComboBox} from '@logistics/components/DropDowns'
import {Loading} from '@features/utils/Utils'

type BatchItemCreateProps = {
    supplyId?: UUID
    onCreated?: (result: BatchCreateItemResult) => void
    onClose?: () => void
}

export function BatchItemCreate({supplyId, onCreated, onClose}: BatchItemCreateProps) {
    const [[nomenclatures]] = useGet<Nomenclature[]>(Api.nomenclatures, [])
    const [[tareTypes]] = useGet<TareType[]>(Api.taretypes, [])

    const [nomenclatureId, setNomenclatureId] = useState<UUID>()
    const [tareTypeId, setTareTypeId] = useState<UUID>()
    const [selectedTare, setSelectedTare] = useState<AvailableTare | null>(null)
    const [barcodeText, setBarcodeText] = useState('')
    const [quantity, setQuantity] = useState<number>(1)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string>()
    const [result, setResult] = useState<BatchCreateItemResult>()

    const selectedNomenclature = nomenclatures?.find(n => n.id === nomenclatureId)
    const selectedTareType = tareTypes?.find(t => t.id === tareTypeId)

    useEffect(() => {
        if (selectedNomenclature?.defaultTareTypeId) {
            setTareTypeId(selectedNomenclature.defaultTareTypeId)
        }
    }, [selectedNomenclature?.defaultTareTypeId])

    const [[availableTares], taresLoading] = useGet<AvailableTare[]>(
        `${Api.tares}/available?tareTypeId=${tareTypeId || ''}`,
        [tareTypeId],
    )

    useEffect(() => {
        setSelectedTare(null)
        setBarcodeText('')
        setQuantity(1)
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

    useEffect(() => {
        if (quantity > maxQuantity && maxQuantity > 0) {
            setQuantity(maxQuantity)
        }
    }, [maxQuantity])

    const isCountableAddressed = (selectedNomenclature?.countable ?? false)
        && (selectedTareType?.sizeX ?? 0) > 0

    const isCountableBulk = (selectedNomenclature?.countable ?? false)
        && (selectedTareType?.countable ?? false)
        && (selectedTareType?.sizeX ?? 0) <= 0

    const canSubmit = nomenclatureId
        && tareTypeId
        && quantity > 0
        && quantity <= maxQuantity
        && !loading

    const handleSubmit = async () => {
        if (!canSubmit) return
        setLoading(true)
        setError(undefined)
        setResult(undefined)

        const body: BatchCreateItemRequest = {
            nomenclatureId: nomenclatureId!,
            tareTypeId: tareTypeId!,
            tareId: selectedTare?.id,
            barcode: selectedTare ? undefined : (barcodeText || undefined),
            quantity,
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
                    tare <strong>{result.tareBarcode || '(no barcode)'}</strong>
                    {' '}({result.tareTypeName}).
                    {result.remaining > 0 && (
                        <> Remaining capacity: {result.remaining}.</>
                    )}
                </Alert>
                <div className="mt-2" style={{display: 'flex', gap: '0.5rem'}}>
                    <Button themeColor="primary" onClick={() => {
                        setResult(undefined)
                        setQuantity(1)
                    }}>
                        Create more
                    </Button>
                    {onClose && (
                        <Button onClick={onClose}>Close</Button>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="p-3">
            <h6>Batch Create Items</h6>
            {error && <Alert color="danger" fade>{error}</Alert>}

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
                <ComboBox
                    data={availableTares || []}
                    textField="barcode"
                    dataItemKey="id"
                    allowCustom={true}
                    value={selectedTare ?? barcodeText}
                    onChange={(e: ComboBoxChangeEvent) => {
                        if (typeof e.value === 'string') {
                            setSelectedTare(null)
                            setBarcodeText(e.value)
                        } else if (e.value && e.value.id) {
                            setSelectedTare(e.value as AvailableTare)
                            setBarcodeText(e.value.barcode || '')
                        } else {
                            setSelectedTare(null)
                            setBarcodeText('')
                        }
                    }}
                    placeholder="Select existing, type new, or leave empty"
                />
                {selectedTare && (
                    <small className="text-muted">
                        Existing tare &mdash; remaining: {selectedTare.remaining}
                    </small>
                )}
                {isNewTare && (
                    <small className="text-muted">
                        New tare will be created{barcodeText ? ` with barcode “${barcodeText}”` : ' without barcode'}.
                    </small>
                )}
            </div>

            <div className="mb-2" style={{maxWidth: '200px'}}>
                <label className="k-label">
                    {isCountableAddressed || isCountableBulk ? 'Number of items' : 'Quantity'}
                </label>
                <NumericTextBox
                    value={quantity}
                    min={isCountableAddressed || isCountableBulk ? 1 : 0.001}
                    max={maxQuantity > 0 ? maxQuantity : undefined}
                    step={isCountableAddressed || isCountableBulk ? 1 : 0.1}
                    format={isCountableAddressed || isCountableBulk ? 'n0' : 'n3'}
                    onChange={(e) => {
                        const v = e.value ?? 1
                        setQuantity(isCountableAddressed || isCountableBulk ? Math.round(v) : v)
                    }}
                />
                {maxQuantity > 0 && (
                    <small className="text-muted">Max: {maxQuantity}</small>
                )}
            </div>

            <div className="mt-3" style={{display: 'flex', gap: '0.5rem'}}>
                <Button
                    themeColor="primary"
                    disabled={!canSubmit}
                    onClick={handleSubmit}
                >
                    {loading ? 'Creating...' : 'Create'}
                </Button>
                {onClose && (
                    <Button onClick={onClose}>Cancel</Button>
                )}
            </div>
            {loading && <Loading/>}
        </div>
    )
}
