import './index' // side-effect: registers the `items` namespace
import api from '@features/api/api.ts'
import Api from '@features/api/api.ts'
import { DetailLinkText } from '@microprojects/edm-components/components'
import {
    HierarchyPicker,
    findInHierarchy,
    pruneHierarchy,
} from '@microprojects/edm-components/components/forms/HierarchyPicker'
import {
    Detail,
    type DetailProps,
} from '@logistics/components/MasterDetail'
import {
    Editor,
    EMPTY_GUID,
    Info,
} from '@microprojects/edm-components/components'
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
import { useGet } from '@microprojects/edm-components/hooks'
import { formatUnits } from '@logistics/utils/format.ts'
import {
    EditorSection,
    Field,
    Properties,
    Property,
} from '@microprojects/edm-components/components'
import { Inventory2Outlined as ItemIcon } from '@mui/icons-material'
import { Box, Chip, Typography } from '@mui/material'
import type React from 'react'
import { type EffectCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

export interface ItemDetailProps extends DetailProps {
    onUpdate?: DetailEventHandler
    type: string
}

function numberOrNull(v: string): number | null {
    if (v === '' || v == null) return null
    const n = Number(v)
    return Number.isFinite(n) ? n : null
}

export function ItemDetail({ id, title, ...props }: ItemDetailProps) {
    const { t } = useTranslation('items')
    const resolvedTitle = title ?? t('title', 'Item')
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
            label={t('source.Output', 'Output')}
            title={t('source.OutputTitle', 'Produced by an order execution.')}
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
            label={t('source.Supply', 'Supply')}
            title={t('source.SupplyTitle', 'Received through a supply.')}
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
            label={t('source.Store', 'Store')}
            title={t('source.StoreTitle', 'Created directly from store (no recorded origin).')}
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
            icon={<ItemIcon />}
            title={resolvedTitle}
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
                                <Property label={t('field.nomenclature', 'Nomenclature')} full>
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
                                    label={t('field.quantity', 'Quantity')}
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
                                        label={t('field.serialNo', 'Serial No')}
                                        value={data.serialNo}
                                        mono
                                    />
                                )}

                                {(data.tareBarcode || data.tareTareTypeName) && (
                                    <Property label={t('field.tare', 'Tare')}>
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
                                        label={t('field.address', 'Address')}
                                        value={`#${data.address}`}
                                        mono
                                    />
                                )}

                                {data.supplyId && (
                                    <Property label={t('field.supply', 'Supply')}>
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
                                    <Property label={t('field.order', 'Order')}>
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
                                                ? t('field.producedBy', 'Produced by')
                                                : t('field.process', 'Process')
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
                                    label={t('field.id', 'Id')}
                                    value={String(data.id)}
                                    mono
                                    muted
                                />

                                {data.isActive === false && (
                                    <Property label={t('field.status', 'Status')}>
                                        <Chip
                                            size="small"
                                            label={t('field.inactive', 'Inactive')}
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
                <Editor
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
                                title={t('editor.sectionWhat', 'What')}
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
                                        {t('field.nomenclature', 'Nomenclature')}
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
                                    label={t('field.serialNo', 'Serial No')}
                                    value={(values.serialNo as string) ?? ''}
                                    onChange={handleChange}
                                />
                                <Field
                                    type="number"
                                    name="quantity"
                                    label={t('field.quantity', 'Quantity')}
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
                                title={t('editor.sectionWhere', 'Where')}
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
                                        {t('field.tareType', 'Tare Type')}
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
                                    label={t('field.tareBarcode', 'Tare Barcode')}
                                    value={
                                        (values.tareBarcode as string) ?? ''
                                    }
                                    onChange={handleChange}
                                />
                                {showAddress && (
                                    <Field
                                        type="number"
                                        name="address"
                                        label={t('field.address', 'Address')}
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
