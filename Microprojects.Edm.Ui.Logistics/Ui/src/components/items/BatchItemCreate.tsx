import Api from '@features/api/api'
import {
    HierarchyPicker,
    findInHierarchy,
    pruneHierarchy,
} from '@logistics/components/HierarchyPicker'
import { useAlertSetter } from '@logistics/components/InlineAlert.tsx'
import { Detail, EMPTY_GUID } from '@logistics/components/MasterDetail'
import { TareBarcodePicker } from '@logistics/components/tare/TareBarcodePicker'
import type {
    AvailableTare,
    BatchCreateItemRequest,
    BatchCreateItemResult,
    Nomenclature,
    NomenclatureTareType,
    TareType,
    TreeDataItem,
    UUID,
} from '@logistics/data/types'
import { useInvalidateEntities } from '@logistics/hooks/entityRefresh'
import { getData, useGet } from '@logistics/hooks/hooks'
import { formatUnits } from '@logistics/utils/format'
import {
    EditorSection,
    Field,
} from '@microprojects/edm-components/components'
import {
    Inventory2Outlined as ItemIcon,
    SaveOutlined as SaveIcon,
} from '@mui/icons-material'
import { Box, Button as MuiButton, Typography } from '@mui/material'
import axios from 'axios'
import { useEffect, useMemo, useState } from 'react'

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

function numberOrNull(v: string): number | null {
    if (v === '' || v == null) return null
    const n = Number(v)
    return Number.isFinite(n) ? n : null
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

    return (
        <Detail
            type="item"
            api={Api.items}
            id={EMPTY_GUID}
            editMode={true}
            readonly={true}
            icon={<ItemIcon />}
            title="New items"
            subTitle={supplyId ? 'Add to supply' : undefined}
            onClose={onClose ?? (() => {})}
            editor={
                <BatchForm
                    nomenclatures={nomenclatures}
                    tareTypes={tareTypes}
                    supplyId={supplyId}
                    onCreated={onCreated}
                    onClose={onClose}
                />
            }
        />
    )
}

type BatchFormProps = {
    nomenclatures: TreeDataItem[] | undefined
    tareTypes: TreeDataItem[] | undefined
    supplyId?: UUID
    onCreated?: (result: BatchCreateItemResult) => void
    onClose?: () => void
}

function BatchForm({
    nomenclatures,
    tareTypes,
    supplyId,
    onCreated,
    onClose,
}: BatchFormProps) {
    const setAlert = useAlertSetter()
    const invalidate = useInvalidateEntities()
    const [values, setValues] = useState<BatchFormValues>({})
    const { nomenclatureId, tareTypeId, tare, quantity } = values

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
        setValues((prev) => ({
            ...prev,
            tareTypeId: selectedNomenclature.defaultTareTypeId,
        }))
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
        setValues((prev) =>
            prev.tareTypeId
                ? prev
                : { ...prev, tareTypeId: tareTypeIdSnapshot },
        )
        ;(async () => {
            const rows = await getData<NomenclatureTareType[]>(
                `${Api.taretypes}/${tareTypeIdSnapshot}/nomenclatures`,
            ).catch(() => undefined)
            setValues((prev) => {
                // Bail if the user has changed tare or already filled
                // nomenclature while the lookup was in flight.
                if (prev.tare?.id !== tareIdSnapshot) return prev
                if (prev.nomenclatureId) return prev
                const def = rows?.find((r) => r.isDefault)
                return def?.nomenclatureId
                    ? { ...prev, nomenclatureId: def.nomenclatureId }
                    : prev
            })
        })()
    }, [tare?.id])

    // Cascade: tare type changed → drop the prior tare (it was filtered by
    // the old type and may no longer be valid). Skipped when the change
    // itself came from auto-fill of a freshly picked tare.
    useEffect(() => {
        if (!tare?.id) return
        if (tare.tareTypeId === tareTypeId) return
        setValues((prev) => ({ ...prev, tare: null }))
    }, [tareTypeId])

    // Cascade: default the quantity to the current max (rounded for countable
    // nomenclatures) — but only when the user hasn't typed anything yet.
    useEffect(() => {
        if (!tareTypeId) return
        if (maxQuantity <= 0) return
        setValues((prev) => {
            if (prev.quantity != null) return prev
            return {
                ...prev,
                quantity: isCountable
                    ? Math.floor(maxQuantity)
                    : maxQuantity,
            }
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!canSubmit) return
        setAlert(undefined)
        const body: BatchCreateItemRequest = {
            nomenclatureId: nomenclatureId!,
            tareTypeId: tareTypeId!,
            tareId: tare?.id || undefined,
            barcode: tare?.barcode ?? '',
            quantity: quantity!,
            supplyId,
        }
        try {
            const response = await axios.post<BatchCreateItemResult>(
                `${Api.items}/batch`,
                body,
            )
            const result = response.data
            const qtyTxt = formatUnits(
                result.quantity,
                result.units,
                result.countable,
            )
            const remainingTxt =
                result.remaining > 0
                    ? ` Remaining capacity: ${formatUnits(result.remaining, result.units, result.countable)}.`
                    : ''
            setAlert({
                message:
                    `Created ${qtyTxt} in tare ` +
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
        } catch (err: any) {
            setAlert({
                status: 'danger',
                message: err.response?.data?.detail || err.message || 'Error',
            })
        }
    }

    const monoLabelSx = {
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        fontWeight: 700,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.07em',
        color: 'var(--ink-3)',
        mb: 0.5,
    }

    return (
        <Box component="form" onSubmit={handleSubmit} noValidate>
            <EditorSection number={1} title="Batch create items" done={false}>
                <Box sx={{ gridColumn: '1 / -1' }}>
                    <Typography sx={monoLabelSx}>Nomenclature</Typography>
                    <HierarchyPicker
                        data={nomenclatures}
                        value={nomenclatureId}
                        onChange={(v) =>
                            setValues((prev) => ({
                                ...prev,
                                nomenclatureId: v as UUID,
                            }))
                        }
                    />
                </Box>
                <Box sx={{ gridColumn: '1 / -1' }}>
                    <Typography sx={monoLabelSx}>Tare Type</Typography>
                    <HierarchyPicker
                        data={tareTypeOptions}
                        value={tareTypeId}
                        onChange={(v) =>
                            setValues((prev) => ({
                                ...prev,
                                tareTypeId: v as UUID,
                            }))
                        }
                    />
                </Box>
                <Box sx={{ gridColumn: '1 / -1' }}>
                    <Typography sx={monoLabelSx}>Tare Barcode</Typography>
                    <TareBarcodePicker
                        tareTypeId={tareTypeId}
                        nomenclatureId={nomenclatureId}
                        value={tare ?? null}
                        onChange={(t) =>
                            setValues((prev) => ({ ...prev, tare: t }))
                        }
                        placeholder="Select existing, type new, or leave empty"
                    />
                    {tareValidation && (
                        <Typography
                            variant="caption"
                            sx={{
                                display: 'block',
                                mt: 0.5,
                                color: 'var(--sig-fault-deep)',
                            }}
                        >
                            {tareValidation}
                        </Typography>
                    )}
                    {!tareValidation && isExistingTare && (
                        <Typography
                            variant="caption"
                            sx={{
                                display: 'block',
                                mt: 0.5,
                                color: 'var(--ink-3)',
                            }}
                        >
                            Existing tare — remaining: {tare?.remaining}
                        </Typography>
                    )}
                    {!tareValidation && !isExistingTare && (
                        <Typography
                            variant="caption"
                            sx={{
                                display: 'block',
                                mt: 0.5,
                                color: 'var(--ink-3)',
                            }}
                        >
                            New tare will be created
                            {tare?.barcode
                                ? ` with barcode “${tare.barcode}”`
                                : ' without barcode'}
                            .
                        </Typography>
                    )}
                </Box>
                <Box sx={{ gridColumn: '1 / -1', maxWidth: 240 }}>
                    <Field
                        type="number"
                        name="quantity"
                        label={
                            isCountable ? 'Number of items' : 'Quantity'
                        }
                        value={quantity ?? ''}
                        onChange={(e) => {
                            const v = numberOrNull(e.target.value)
                            setValues((prev) => ({
                                ...prev,
                                quantity:
                                    v == null
                                        ? null
                                        : isCountable
                                          ? Math.round(v)
                                          : v,
                            }))
                        }}
                        help={
                            maxQuantity > 0
                                ? `Max: ${maxQuantity}`
                                : undefined
                        }
                    />
                </Box>
            </EditorSection>
            <Box
                sx={{
                    position: 'sticky',
                    bottom: 10,
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 1,
                    py: 1,
                    background: 'var(--surface)',
                    borderTop: '1px solid var(--line)',
                    mt: 2,
                }}
            >
                <MuiButton
                    type="submit"
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    disabled={!canSubmit}
                >
                    Create
                </MuiButton>
                {onClose && (
                    <MuiButton onClick={onClose} type="button">
                        Cancel
                    </MuiButton>
                )}
            </Box>
        </Box>
    )
}
