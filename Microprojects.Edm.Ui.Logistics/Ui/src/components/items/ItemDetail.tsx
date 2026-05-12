import api from '@features/api/api.ts'
import Api from '@features/api/api.ts'
import { DetailLinkText } from '@logistics/components/DropDownCell.tsx'
import {
    HierarchyPicker,
    findInHierarchy,
    pruneHierarchy,
} from '@logistics/components/HierarchyPicker.tsx'
import {
    Detail,
    type DetailProps,
    EMPTY_GUID,
    Info,
    MuiEditor,
} from '@logistics/components/MasterDetail.tsx'
import { NomenclatureDetail } from '@logistics/components/config/nomenclature/Nomenclatures.tsx'
import { ProcessDetail } from '@logistics/components/config/process/Processes.tsx'
import { ItemGenealogyTree } from '@logistics/components/items/ItemGenealogyTree.tsx'
import '@logistics/components/items/ItemGenealogyTree.css'
import { OrderDetail } from '@logistics/components/orders/OrderDetail.tsx'
import { SupplyDetail } from '@logistics/components/supplies/SupplyDetail.tsx'
import {
    type DetailEventHandler,
    type Item,
    type Nomenclature,
    type NomenclatureTareType,
    type TareType,
    type TreeDataItem,
    type UUID,
} from '@logistics/data/types'
import { useGet } from '@logistics/hooks/hooks.ts'
import { formatUnits } from '@logistics/utils/format.ts'
import {
    EditorSection,
    Field,
    Properties,
    Property,
} from '@microprojects/edm-components/components'
import { Box, Chip, Typography } from '@mui/material'
import type React from 'react'
import { type EffectCallback, useEffect, useMemo, useState } from 'react'
import { Diagram3 } from 'react-bootstrap-icons'

export interface ItemDetailProps extends DetailProps {
    onUpdate?: DetailEventHandler
    type: string
}

function numberOrNull(v: string): number | null {
    if (v === '' || v == null) return null
    const n = Number(v)
    return Number.isFinite(n) ? n : null
}

export function ItemDetail({ id, title = 'Item', ...props }: ItemDetailProps) {
    const [subDetail, setSubDetail] = useState<React.ReactElement>()
    useEffect(setSubDetail as EffectCallback, [id])
    const [[taretypes]] = useGet<TreeDataItem[]>(
        `${Api.taretypes}/hierarchy`,
        [],
    )
    const [[nomenclatures]] = useGet<TreeDataItem[]>(
        `${Api.nomenclatures}/hierarchy`,
        [],
    )
    let [[data, setData], loading, error] = useGet<Item>(
        `${Api.items}/${id || EMPTY_GUID}`,
        [id],
    )
    if (!data || data.id === EMPTY_GUID) {
        data = { ...data, name: '', description: '' } as Item
    }

    const selectedNomenclature = findInHierarchy(
        nomenclatures,
        data?.nomenclatureId,
    ) as Nomenclature | null
    const selectedTareType = findInHierarchy(
        taretypes,
        data?.tareTareTypeId,
    ) as TareType | null

    const [[allowedRows]] = useGet<NomenclatureTareType[]>(
        data?.nomenclatureId
            ? `${Api.nomenclatures}/${data.nomenclatureId}/taretypes`
            : '',
        [data?.nomenclatureId],
    )
    const allowedTareTypeIds = useMemo(
        () =>
            data?.nomenclatureId && allowedRows
                ? new Set<UUID>(allowedRows.map((r) => r.tareTypeId))
                : null,
        [data?.nomenclatureId, allowedRows],
    )
    const tareTypeOptions = useMemo(
        () =>
            allowedTareTypeIds
                ? pruneHierarchy(taretypes, allowedTareTypeIds)
                : (taretypes ?? []),
        [taretypes, allowedTareTypeIds],
    )
    const showAddress =
        (selectedTareType?.sizeX ?? 0) > 0 &&
        (selectedNomenclature?.countable ?? false) === true

    const sourceChip = data.isOutput ? (
        <Chip
            size="small"
            label="Output"
            title="Produced by an order execution."
            sx={{
                ml: 1,
                height: 22,
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                background: 'var(--ent-operation-soft)',
                color: 'var(--ent-operation-deep)',
                border: '1px solid var(--ent-operation-deep)',
            }}
        />
    ) : data.supplyId ? (
        <Chip
            size="small"
            label="Supply"
            title="Received through a supply."
            sx={{
                ml: 1,
                height: 22,
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                background: 'var(--ent-supply-soft)',
                color: 'var(--ent-supply-deep)',
                border: '1px solid var(--ent-supply-deep)',
            }}
        />
    ) : data.isStore ? (
        <Chip
            size="small"
            label="Store"
            title="Created directly from store (no recorded origin)."
            sx={{
                ml: 1,
                height: 22,
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                background: 'var(--surface-2)',
                color: 'var(--ink-2)',
                border: '1px solid var(--line-strong)',
            }}
        />
    ) : null

    return (
        <Detail
            {...props}
            id={id}
            icon={<Diagram3 title="Item" />}
            title={title}
            subTitle={data.description}
            loading={loading}
            error={error as string}
            data={data}
            subDetail={subDetail}
            card={
                <Info
                    content={
                        data && (
                            <Properties>
                                <Property label="Nomenclature" full>
                                    {data.nomenclatureName ? (
                                        <DetailLinkText
                                            id={data.nomenclatureId}
                                            text={data.nomenclatureName}
                                            onClick={() =>
                                                setSubDetail(
                                                    <NomenclatureDetail
                                                        readonly={true}
                                                        id={
                                                            data.nomenclatureId
                                                        }
                                                        api={Api.nomenclatures}
                                                        onClose={() =>
                                                            setSubDetail(
                                                                undefined,
                                                            )
                                                        }
                                                    />,
                                                )
                                            }
                                        />
                                    ) : (
                                        <Typography
                                            component="span"
                                            sx={{ color: 'var(--ink-3)' }}
                                        >
                                            —
                                        </Typography>
                                    )}
                                    {selectedNomenclature?.category && (
                                        <Typography
                                            component="span"
                                            sx={{
                                                ml: 1,
                                                color: 'var(--ink-3)',
                                            }}
                                        >
                                            · {selectedNomenclature.category}
                                        </Typography>
                                    )}
                                    {sourceChip}
                                </Property>

                                <Property
                                    label="Quantity"
                                    value={formatUnits(
                                        data.quantity,
                                        data.tareTareTypeUnits ??
                                            selectedTareType?.units,
                                        selectedNomenclature?.countable,
                                    )}
                                    mono
                                />

                                {data.serialNo && (
                                    <Property
                                        label="Serial No"
                                        value={data.serialNo}
                                        mono
                                    />
                                )}

                                {(data.tareBarcode || data.tareTareTypeName) && (
                                    <Property label="Tare">
                                        {data.tareTareTypeName && (
                                            <span>{data.tareTareTypeName}</span>
                                        )}
                                        {data.tareBarcode && (
                                            <Typography
                                                component="span"
                                                sx={{
                                                    fontFamily:
                                                        'var(--font-mono)',
                                                }}
                                            >
                                                {data.tareTareTypeName
                                                    ? ' · '
                                                    : ''}
                                                {data.tareBarcode}
                                            </Typography>
                                        )}
                                    </Property>
                                )}

                                {showAddress && data.address != null && (
                                    <Property
                                        label="Address"
                                        value={`#${data.address}`}
                                        mono
                                    />
                                )}

                                {data.supplyId && (
                                    <Property label="Supply">
                                        <DetailLinkText
                                            id={data.supplyId}
                                            text={
                                                data.supplyName ||
                                                `${String(data.supplyId).slice(0, 8)}…`
                                            }
                                            onClick={() =>
                                                setSubDetail(
                                                    <SupplyDetail
                                                        readonly={true}
                                                        id={data.supplyId}
                                                        api={Api.supplies}
                                                        onClose={() =>
                                                            setSubDetail(
                                                                undefined,
                                                            )
                                                        }
                                                    />,
                                                )
                                            }
                                        />
                                    </Property>
                                )}

                                {data.orderId && (
                                    <Property label="Order">
                                        <DetailLinkText
                                            id={data.orderId}
                                            text={
                                                data.orderNumber
                                                    ? `#${data.orderNumber}`
                                                    : data.orderName ||
                                                      `${String(data.orderId).slice(0, 8)}…`
                                            }
                                            onClick={() =>
                                                setSubDetail(
                                                    <OrderDetail
                                                        readonly={true}
                                                        id={data.orderId}
                                                        api={Api.orders}
                                                        path={props.path}
                                                        type="order"
                                                        onClose={() =>
                                                            setSubDetail(
                                                                undefined,
                                                            )
                                                        }
                                                    />,
                                                )
                                            }
                                        />
                                        {data.orderNumber &&
                                            data.orderName && (
                                                <Typography
                                                    component="span"
                                                    sx={{
                                                        ml: 1,
                                                        color: 'var(--ink-3)',
                                                    }}
                                                >
                                                    · {data.orderName}
                                                </Typography>
                                            )}
                                    </Property>
                                )}

                                {data.processId && (
                                    <Property
                                        label={
                                            data.isOutput
                                                ? 'Produced by'
                                                : 'Process'
                                        }
                                    >
                                        <DetailLinkText
                                            id={data.processId}
                                            text={
                                                data.processName ||
                                                `${String(data.processId).slice(0, 8)}…`
                                            }
                                            onClick={() =>
                                                setSubDetail(
                                                    <ProcessDetail
                                                        readonly={true}
                                                        processId={
                                                            data.processId
                                                        }
                                                        api={Api.processes}
                                                        onClose={() =>
                                                            setSubDetail(
                                                                undefined,
                                                            )
                                                        }
                                                    />,
                                                )
                                            }
                                        />
                                    </Property>
                                )}

                                <Property
                                    label="Id"
                                    value={String(data.id)}
                                    mono
                                    muted
                                />

                                {data.isActive === false && (
                                    <Property label="Status">
                                        <Chip
                                            size="small"
                                            label="Inactive"
                                            sx={{
                                                height: 22,
                                                fontSize: 11,
                                                background: 'var(--surface-2)',
                                                color: 'var(--ink-3)',
                                                border: '1px solid var(--line-strong)',
                                            }}
                                        />
                                    </Property>
                                )}
                            </Properties>
                        )
                    }
                />
            }
            editor={
                <MuiEditor
                    type={props.type}
                    api={props.api}
                    path={props.path}
                    onChange={props.onChange}
                    data={data}
                    setData={setData}
                    onUpdate={props.onUpdate}
                    content={({ values, handleChange }) => (
                        <Box>
                            <EditorSection
                                number={1}
                                title="What"
                                done={false}
                            >
                                <Box sx={{ gridColumn: '1 / -1' }}>
                                    <Typography
                                        sx={{
                                            fontFamily: 'var(--font-mono)',
                                            fontSize: 11,
                                            fontWeight: 700,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.07em',
                                            color: 'var(--ink-3)',
                                            mb: 0.5,
                                        }}
                                    >
                                        Nomenclature
                                    </Typography>
                                    <HierarchyPicker
                                        data={nomenclatures}
                                        value={values.nomenclatureId}
                                        onChange={(v) =>
                                            handleChange({
                                                target: {
                                                    name: 'nomenclatureId',
                                                    value: v,
                                                },
                                            })
                                        }
                                    />
                                </Box>
                                <Field
                                    name="serialNo"
                                    label="Serial No"
                                    value={(values.serialNo as string) ?? ''}
                                    onChange={handleChange}
                                />
                                <Field
                                    type="number"
                                    name="quantity"
                                    label="Quantity"
                                    value={(values.quantity as number) ?? ''}
                                    onChange={(e) =>
                                        handleChange({
                                            target: {
                                                name: 'quantity',
                                                value: numberOrNull(
                                                    e.target.value,
                                                ),
                                            },
                                        })
                                    }
                                />
                            </EditorSection>

                            <EditorSection
                                number={2}
                                title="Where"
                                done={false}
                            >
                                <Box sx={{ gridColumn: '1 / -1' }}>
                                    <Typography
                                        sx={{
                                            fontFamily: 'var(--font-mono)',
                                            fontSize: 11,
                                            fontWeight: 700,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.07em',
                                            color: 'var(--ink-3)',
                                            mb: 0.5,
                                        }}
                                    >
                                        Tare Type
                                    </Typography>
                                    <HierarchyPicker
                                        data={tareTypeOptions}
                                        value={values.tareTareTypeId}
                                        onChange={(v) =>
                                            handleChange({
                                                target: {
                                                    name: 'tareTareTypeId',
                                                    value: v,
                                                },
                                            })
                                        }
                                    />
                                </Box>
                                <Field
                                    name="tareBarcode"
                                    label="Tare Barcode"
                                    value={
                                        (values.tareBarcode as string) ?? ''
                                    }
                                    onChange={handleChange}
                                />
                                {showAddress && (
                                    <Field
                                        type="number"
                                        name="address"
                                        label="Address"
                                        value={
                                            (values.address as number) ?? ''
                                        }
                                        onChange={(e) =>
                                            handleChange({
                                                target: {
                                                    name: 'address',
                                                    value: numberOrNull(
                                                        e.target.value,
                                                    ),
                                                },
                                            })
                                        }
                                    />
                                )}
                            </EditorSection>
                        </Box>
                    )}
                />
            }
            relations={
                <ItemGenealogyTree
                    itemId={id as any}
                    onSelect={(selectedId) =>
                        setSubDetail(
                            <ItemDetail
                                readonly={true}
                                id={selectedId}
                                api={props.api}
                                path={props.path}
                                type={props.type}
                                onClose={() => setSubDetail(undefined)}
                            />,
                        )
                    }
                />
            }
        />
    )
}
