import Api from '@features/api/api'
import {
    HierarchyPicker,
    findInHierarchy,
    pruneHierarchy,
} from '@logistics/components/HierarchyPicker'
import {
    type AlertState,
    InlineAlert,
} from '@logistics/components/InlineAlert.tsx'
import { Detail, EMPTY_GUID } from '@logistics/components/MasterDetail'
import { TareBarcodePicker } from '@logistics/components/tare/TareBarcodePicker'
import type {
    AvailableTare,
    BatchCreateItemRequest,
    BatchCreateItemResult,
    Dictionary,
    Nomenclature,
    NomenclatureTareType,
    TareType,
    TreeDataItem,
    UUID,
} from '@logistics/data/types'
import { useInvalidateEntities } from '@logistics/hooks/entityRefresh'
import { getData, useGet } from '@logistics/hooks/hooks'
import { Button } from '@progress/kendo-react-buttons'
import { Form, FormElement } from '@progress/kendo-react-form'
import { NumericTextBox } from '@progress/kendo-react-inputs'
import axios from 'axios'
import { useEffect, useMemo, useState } from 'react'
import { Box2 } from 'react-bootstrap-icons'

type BatchItemCreateProps = {
    supplyId?: UUID
    onCreated?: (result: BatchCreateItemResult) => void
    onClose?: () => void
}

type BatchFormValues = {
    nomenclatureId?: UUID
    tareTypeId?: UUID
    tare?: AvailableTare | null
    quantity?: number | null
}

export function BatchItemCreate({
    supplyId,
    onCreated,
    onClose,
}: BatchItemCreateProps) {
    const [[nomenclatures]] = useGet<TreeDataItem[]>(
        `${Api.nomenclatures}/hierarchy`,
        [],
    )
    const [[tareTypes]] = useGet<TreeDataItem[]>(
        `${Api.taretypes}/hierarchy`,
        [],
    )
    const [alert, setAlert] = useState<AlertState>()
    const invalidate = useInvalidateEntities()

    const handleSubmit = async (raw: Dictionary) => {
        const data = raw as BatchFormValues
        if (
            !data.nomenclatureId ||
            !data.tareTypeId ||
            data.quantity == null ||
            data.quantity <= 0
        ) {
            return
        }
        setAlert(undefined)
        const body: BatchCreateItemRequest = {
            nomenclatureId: data.nomenclatureId,
            tareTypeId: data.tareTypeId,
            tareId: data.tare?.id || undefined,
            barcode: data.tare?.barcode ?? '',
            quantity: data.quantity,
            supplyId,
        }
        try {
            const response = await axios.post<BatchCreateItemResult>(
                `${Api.items}/batch`,
                body,
            )
            const result = response.data
            const remainingTxt =
                result.remaining > 0
                    ? ` Remaining capacity: ${result.remaining}.`
                    : ''
            setAlert({
                message:
                    `Created ${result.createdCount} item(s) in tare ` +
                    `${result.tareBarcode || '(no barcode)'}` +
                    `${result.tareTypeName ? ` (${result.tareTypeName})` : ''}.` +
                    remainingTxt,
            })
            invalidate([
                { type: 'item' },
                { type: 'tare' },
                { type: 'tare', id: result.tareId },
                ...(supplyId ? [{ type: 'supply', id: supplyId }] : []),
            ])
            onCreated?.(result)
        } catch (e: any) {
            setAlert({
                status: 'danger',
                message: e.response?.data?.detail || e.message || 'Error',
            })
        }
    }

    return (
        <Detail
            api={Api.items}
            id={EMPTY_GUID}
            editMode={true}
            readonly={true}
            icon={<Box2 title="Batch create items" />}
            title="New items"
            subTitle={supplyId ? 'Add to supply' : undefined}
            onClose={onClose ?? (() => {})}
            editor={
                <>
                    <InlineAlert
                        state={alert}
                        onClose={() => setAlert(undefined)}
                    />
                    <Form
                        onSubmit={handleSubmit}
                        render={(form) => (
                            <BatchFormBody
                                form={form}
                                nomenclatures={nomenclatures}
                                tareTypes={tareTypes}
                                onCancel={onClose}
                            />
                        )}
                    />
                </>
            }
        />
    )
}

type BatchFormBodyProps = {
    form: any
    nomenclatures: TreeDataItem[] | undefined
    tareTypes: TreeDataItem[] | undefined
    onCancel?: () => void
}

function BatchFormBody({
    form,
    nomenclatures,
    tareTypes,
    onCancel,
}: BatchFormBodyProps) {
    const nomenclatureId = form.valueGetter('nomenclatureId') as
        | UUID
        | undefined
    const tareTypeId = form.valueGetter('tareTypeId') as UUID | undefined
    const tare = form.valueGetter('tare') as AvailableTare | null | undefined
    const quantity = form.valueGetter('quantity') as number | null | undefined

    const [[allowedRows]] = useGet<NomenclatureTareType[]>(
        nomenclatureId
            ? `${Api.nomenclatures}/${nomenclatureId}/taretypes`
            : '',
        [nomenclatureId],
    )
    const allowedTareTypeIds = useMemo(
        () =>
            nomenclatureId && allowedRows
                ? new Set<UUID>(allowedRows.map((r) => r.tareTypeId))
                : null,
        [nomenclatureId, allowedRows],
    )
    const tareTypeOptions = useMemo(
        () =>
            allowedTareTypeIds
                ? pruneHierarchy(tareTypes, allowedTareTypeIds)
                : (tareTypes ?? []),
        [tareTypes, allowedTareTypeIds],
    )

    const selectedNomenclature = findInHierarchy(
        nomenclatures,
        nomenclatureId,
    ) as Nomenclature | null
    const selectedTareType = findInHierarchy(
        tareTypes,
        tareTypeId,
    ) as TareType | null

    const isCountable = selectedNomenclature?.countable ?? false
    const isExistingTare = !!tare?.id
    const maxQuantity = useMemo(() => {
        if (tare?.id) return tare.remaining
        if (selectedTareType) return selectedTareType.capacity
        return 0
    }, [tare, selectedTareType])

    // Cascade: nomenclature pick → default tare type. The auto-fill from a
    // picked tare (below) chooses a nomenclature whose default IS that tare's
    // type, so this cascade is a no-op in that flow; when the user changes
    // nomenclature manually, it's expected to retarget the tare type.
    useEffect(() => {
        if (!selectedNomenclature?.defaultTareTypeId) return
        form.onChange('tareTypeId', {
            value: selectedNomenclature.defaultTareTypeId,
        })
    }, [selectedNomenclature?.defaultTareTypeId])

    // Cascade: existing-tare pick → fill in nomenclature/tare-type when not
    // yet set. Tare type comes straight from the picked tare; nomenclature
    // is the one that has this tare type as its DEFAULT (NomenclatureTareType.
    // isDefault row), if any.
    useEffect(() => {
        if (!tare?.id) return
        const tareIdSnapshot = tare.id
        const tareTypeIdSnapshot = tare.tareTypeId
        if (!tareTypeIdSnapshot) return
        const currentTareTypeId = form.valueGetter('tareTypeId') as
            | UUID
            | undefined
        if (!currentTareTypeId) {
            form.onChange('tareTypeId', { value: tareTypeIdSnapshot })
        }
        const currentNomenclatureId = form.valueGetter('nomenclatureId') as
            | UUID
            | undefined
        if (currentNomenclatureId) return
        ;(async () => {
            const rows = await getData<NomenclatureTareType[]>(
                `${Api.taretypes}/${tareTypeIdSnapshot}/nomenclatures`,
            ).catch(() => undefined)
            // Bail out if the user has changed tare or already filled
            // nomenclature while the lookup was in flight.
            const stillTare = form.valueGetter('tare') as
                | AvailableTare
                | null
                | undefined
            if (stillTare?.id !== tareIdSnapshot) return
            if (form.valueGetter('nomenclatureId')) return
            const def = rows?.find((r) => r.isDefault)
            if (def?.nomenclatureId) {
                form.onChange('nomenclatureId', { value: def.nomenclatureId })
            }
        })()
    }, [tare?.id])

    // Cascade: tare type changed → drop the prior tare (it was filtered by
    // the old type and may no longer be valid). Skipped when the change
    // itself came from auto-fill of a freshly picked tare.
    useEffect(() => {
        if (!tare?.id) return
        if (tare.tareTypeId === tareTypeId) return
        form.onChange('tare', { value: null })
    }, [tareTypeId])

    // Cascade: default the quantity to the current max (rounded for countable
    // nomenclatures, mirroring TareType's CountableFields/NonCountableFields
    // rules) — but only when the user hasn't typed anything yet. Reading the
    // current value via valueGetter rather than depending on `quantity`
    // avoids re-firing on every quantity change.
    useEffect(() => {
        if (!tareTypeId) return
        if (maxQuantity <= 0) return
        const current = form.valueGetter('quantity') as
            | number
            | null
            | undefined
        if (current != null) return
        form.onChange('quantity', {
            value: isCountable ? Math.floor(maxQuantity) : maxQuantity,
        })
    }, [tareTypeId, isExistingTare, maxQuantity, isCountable])

    // Validate a picked existing tare against currently-set nomenclature/
    // tare type. Picker filters by these when set, but the form lets you
    // pick a tare first and a nomenclature later, so the combination can
    // become inconsistent.
    const tareValidation = useMemo<string | null>(() => {
        if (!tare?.id) return null
        if (tareTypeId && tare.tareTypeId !== tareTypeId) {
            return "Picked tare's type doesn't match the selected tare type."
        }
        if (allowedTareTypeIds && !allowedTareTypeIds.has(tare.tareTypeId)) {
            return "Picked tare's type is not allowed for the selected nomenclature."
        }
        return null
    }, [tare, tareTypeId, allowedTareTypeIds])

    const canSubmit = !!(
        nomenclatureId &&
        tareTypeId &&
        quantity != null &&
        quantity > 0 &&
        (maxQuantity === 0 || quantity <= maxQuantity) &&
        !tareValidation
    )

    return (
        <FormElement>
            <fieldset className="k-form-fieldset">
                <legend className="k-form-legend">Batch create items</legend>
                <div className="mb-3">
                    <label className="k-label">Nomenclature</label>
                    <HierarchyPicker
                        data={nomenclatures}
                        value={nomenclatureId}
                        onChange={(v) =>
                            form.onChange('nomenclatureId', { value: v })
                        }
                    />
                </div>
                <div className="mb-3">
                    <label className="k-label">Tare Type</label>
                    <HierarchyPicker
                        data={tareTypeOptions}
                        value={tareTypeId}
                        onChange={(v) =>
                            form.onChange('tareTypeId', { value: v })
                        }
                    />
                </div>
                <div className="mb-3">
                    <label className="k-label">Tare Barcode</label>
                    <TareBarcodePicker
                        tareTypeId={tareTypeId}
                        nomenclatureId={nomenclatureId}
                        value={tare ?? null}
                        onChange={(t) => form.onChange('tare', { value: t })}
                        placeholder="Select existing, type new, or leave empty"
                    />
                    {tareValidation && (
                        <small className="text-danger">{tareValidation}</small>
                    )}
                    {!tareValidation && isExistingTare && (
                        <small className="text-muted">
                            Existing tare &mdash; remaining: {tare?.remaining}
                        </small>
                    )}
                    {!tareValidation && !isExistingTare && (
                        <small className="text-muted">
                            New tare will be created
                            {tare?.barcode
                                ? ` with barcode “${tare.barcode}”`
                                : ' without barcode'}
                            .
                        </small>
                    )}
                </div>
                {isCountable ? (
                    <div className="mb-3">
                        <label className="k-label">Number of items</label>
                        <NumericTextBox
                            value={quantity ?? null}
                            min={1}
                            max={maxQuantity > 0 ? maxQuantity : undefined}
                            step={1}
                            format="n0"
                            onChange={(e) => {
                                const v = e.value
                                form.onChange('quantity', {
                                    value: v == null ? null : Math.round(v),
                                })
                            }}
                        />
                        {maxQuantity > 0 && (
                            <small className="text-muted">
                                Max: {maxQuantity}
                            </small>
                        )}
                    </div>
                ) : (
                    <div className="mb-3">
                        <label className="k-label">Quantity</label>
                        <NumericTextBox
                            value={quantity ?? null}
                            min={0.001}
                            max={maxQuantity > 0 ? maxQuantity : undefined}
                            step={0.1}
                            format="n3"
                            onChange={(e) => {
                                form.onChange('quantity', {
                                    value: e.value ?? null,
                                })
                            }}
                        />
                        {maxQuantity > 0 && (
                            <small className="text-muted">
                                Max: {maxQuantity}
                            </small>
                        )}
                    </div>
                )}
            </fieldset>
            <div
                className="k-form-buttons"
                style={{
                    position: 'sticky',
                    bottom: 10,
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '0.5rem',
                    backgroundColor: 'white',
                }}
            >
                <Button
                    name="save"
                    themeColor={canSubmit ? 'primary' : 'secondary'}
                    icon="save"
                    type="submit"
                    disabled={!canSubmit}
                >
                    Create
                </Button>
                {onCancel && (
                    <Button onClick={onCancel} type="button">
                        Cancel
                    </Button>
                )}
            </div>
        </FormElement>
    )
}
