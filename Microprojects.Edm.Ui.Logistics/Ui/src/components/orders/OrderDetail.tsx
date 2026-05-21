import '@logistics/components/orders' // side-effect: registers the `orders` namespace
import api from '@features/api/api.ts'
import Api from '@features/api/api.ts'
import { DetailLinkText } from '@logistics/components/DropDownCell.tsx'
import { HierarchyPicker } from '@logistics/components/HierarchyPicker.tsx'
import { useAlertSetter } from '@logistics/components/InlineAlert.tsx'
import {
    Detail,
    type DetailProps,
    EMPTY_GUID,
    Info,
    MuiEditor,
} from '@logistics/components/MasterDetail.tsx'
import { NomenclatureDetail } from '@logistics/components/config/nomenclature/Nomenclatures.tsx'
import { ProcessDetail } from '@logistics/components/config/process/Processes.tsx'
import { AllocateOutputWindow } from '@logistics/components/orders/AllocateOutputWindow.tsx'
import { OrderTabs } from '@logistics/components/orders/OrderTabs.tsx'
import type {
    DetailEventHandler,
    Order,
    OrderOutputItems,
    OrderProcess,
    TreeDataItem,
    UUID,
} from '@logistics/data/types'
import type { ExecuteResult } from '@logistics/data/types'
import {
    listTag,
    useEntityToken,
    useInvalidateEntities,
} from '@logistics/hooks/entityRefresh'
import { useGet } from '@logistics/hooks/hooks.ts'
import { resolveError } from '@logistics/i18n/resolveError'
import { formatLocalDate, parseUtcDate } from '@logistics/utils/format'
import {
    EditorSection,
    Field,
    Properties,
    Property,
} from '@microprojects/edm-components/components'
import {
    CheckOutlined as CheckIcon,
    GridOnOutlined as GridIcon,
    ListAltOutlined as OrderIcon,
    PlayArrowOutlined as PlayIcon,
    VisibilityOutlined as PreviewIcon,
} from '@mui/icons-material'
import { Box, Button as MuiButton, Chip, Typography } from '@mui/material'
import axios from 'axios'
import type React from 'react'
import { type EffectCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

export interface OrderDetailProps extends DetailProps {
    onUpdate?: DetailEventHandler
    type: string
}

function numberOrNull(v: string): number | null {
    if (v === '' || v == null) return null
    const n = Number(v)
    return Number.isFinite(n) ? n : null
}

// Date <-> input[type=date] string conversion. The form keeps a Date object so
// the existing axios payload (which serialises Dates) keeps working untouched;
// the native date picker only reads/writes ISO YYYY-MM-DD strings.
function toDateInputValue(d: unknown): string {
    if (!d) return ''
    const date = d instanceof Date ? d : new Date(d as string)
    if (Number.isNaN(date.getTime())) return ''
    const y = date.getFullYear().toString().padStart(4, '0')
    const m = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${y}-${m}-${day}`
}

function fromDateInputValue(s: string): Date | null {
    if (!s) return null
    const [y, m, d] = s.split('-').map(Number)
    if (!y || !m || !d) return null
    return new Date(y, m - 1, d)
}

export function OrderDetail({
    id,
    title,
    ...props
}: OrderDetailProps) {
    const { t } = useTranslation('orders')
    const resolvedTitle = title ?? t('detail.defaultTitle', 'Order')
    const setAlert = useAlertSetter()
    const [subDetail, setSubDetail] = useState<React.ReactElement>()
    const [allocateOpen, setAllocateOpen] = useState(false)
    const navigate = useNavigate()
    useEffect(setSubDetail as EffectCallback, [id])
    const [[hierarchy]] = useGet<TreeDataItem[]>(
        `${Api.processes}/hierarchy?kind=Technology`,
        [],
    )
    const invalidate = useInvalidateEntities()
    const orderToken = useEntityToken([{ type: 'order', id }])
    let [[data, setData], loading, error] = useGet<Order>(
        `${Api.orders}/${id || EMPTY_GUID}`,
        [id, orderToken],
    )
    // After a Create, the prop `id` stays undefined (the panel is not
    // route-driven), but `data.id` is set to the new GUID via setData.
    // Fall back to data.id so the Tabs and the operations fetch see it.
    const effectiveId =
        id ||
        (data?.id && data.id !== EMPTY_GUID ? (data.id as UUID) : undefined)
    const effectiveToken = useEntityToken([
        { type: 'order', id: effectiveId },
    ])
    const [[orderProcesses]] = useGet<OrderProcess[]>(
        effectiveId
            ? `${Api.orders}/${effectiveId}/operations`
            : `${Api.orders}/${EMPTY_GUID}/operations`,
        [effectiveId, effectiveToken],
    )
    const [[outputItems]] = useGet<OrderOutputItems>(
        effectiveId
            ? `${Api.orders}/${effectiveId}/output-items`
            : `${Api.orders}/${EMPTY_GUID}/output-items`,
        [effectiveId, effectiveToken],
    )
    if (!data || data.id === EMPTY_GUID) {
        const today = new Date()
        data = {
            ...data,
            number: data?.number ?? '',
            name: '',
            description: '',
            startDate: today,
            dueDate: today,
        } as Order
    }

    const isCompleted = !!data?.completed
    const isDeleted = !!data?.deleted
    const mainProcess = orderProcesses?.[0]
    const processCompleted = !!mainProcess?.endTime
    const unallocatedCount = outputItems?.unallocated?.length ?? 0
    const allAllocated = processCompleted && unallocatedCount === 0
    const startDisabled =
        !effectiveId || isCompleted || isDeleted || processCompleted
    const startDisabledReason = isDeleted
        ? t('detail.disabledReason.orderDeleted', 'Order is deleted')
        : isCompleted
          ? t('detail.disabledReason.orderCompleted', 'Order is completed')
          : processCompleted
            ? t('detail.disabledReason.processCompleted', 'Process is already completed')
            : undefined
    const startOrder = () => {
        axios
            .post<ExecuteResult>(`${Api.orders}/${effectiveId}/execute`)
            .then((r) => {
                const { completed, pendingCount } = r.data
                invalidate([
                    { type: 'order', id: effectiveId },
                    { type: 'item' },
                    { type: 'tare' },
                ])
                if (pendingCount > 0) {
                    setAllocateOpen(true)
                    return
                }
                setAlert({
                    message: completed
                        ? t('detail.toast.executedCompleted', 'The order executed and completed')
                        : t('detail.toast.executedSuccessfully', 'The order executed successfully'),
                })
            })
            .catch((e) => {
                setAlert({
                    message: resolveError(e, t('common:error')),
                    status: 'danger',
                })
            })
    }

    const completeOrder = () => {
        axios
            .post(`${Api.orders}/${effectiveId}/complete`, {})
            .then(() => {
                invalidate([
                    { type: 'order' },
                    { type: 'order', id: effectiveId },
                    listTag('order'),
                ])
                props.onClose?.(
                    undefined as unknown as React.MouseEvent<HTMLElement>,
                )
            })
            .catch((e) => {
                setAlert({
                    message: resolveError(e, t('detail.toast.completeFailed', 'Failed to complete the order')),
                    status: 'danger',
                })
            })
    }

    const statusChip = data?.status ? (
        <Chip
            size="small"
            label={t(`widgets:status.${data.status}`)}
            sx={{
                height: 22,
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                fontWeight: 700,
                background: 'var(--surface-2)',
                color: 'var(--ink-1)',
                border: '1px solid var(--line-strong)',
            }}
        />
    ) : null

    return (
        <>
            {allocateOpen && effectiveId && (
                <AllocateOutputWindow
                    orderId={effectiveId}
                    onClose={() => setAllocateOpen(false)}
                    onChanged={() =>
                        invalidate([{ type: 'order', id: effectiveId }])
                    }
                />
            )}
            <Detail
                {...props}
                id={id}
                icon={<OrderIcon />}
                title={data?.number ? `#${data.number}` : resolvedTitle}
                subTitle={data.description}
                loading={loading}
                error={error as string}
                data={data}
                subDetail={subDetail}
                card={
                    <Info
                        content={
                            data && (
                                <Box>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            flexWrap: 'wrap',
                                            gap: 1,
                                            mb: 1.25,
                                        }}
                                    >
                                        {data?.number && (
                                            <Typography
                                                variant="h6"
                                                sx={{
                                                    m: 0,
                                                    fontFamily:
                                                        'var(--font-mono)',
                                                    fontWeight: 700,
                                                }}
                                            >
                                                #{data.number}
                                            </Typography>
                                        )}
                                        {statusChip}
                                        {data?.executor && (
                                            <Typography
                                                variant="caption"
                                                sx={{ color: 'var(--ink-3)' }}
                                            >
                                                {t('detail.executedBy', 'Executed by')}{' '}
                                                <b>{data.executor}</b>
                                            </Typography>
                                        )}
                                        <Box sx={{ flex: 1 }} />
                                        {!processCompleted && (
                                            <MuiButton
                                                variant="contained"
                                                size="small"
                                                startIcon={<PlayIcon />}
                                                onClick={startOrder}
                                                disabled={startDisabled}
                                                title={startDisabledReason}
                                            >
                                                {t('detail.executeOrder', 'Execute order')}
                                            </MuiButton>
                                        )}
                                        {processCompleted &&
                                            !isCompleted &&
                                            !allAllocated && (
                                                <MuiButton
                                                    variant="contained"
                                                    size="small"
                                                    startIcon={<GridIcon />}
                                                    onClick={() =>
                                                        setAllocateOpen(true)
                                                    }
                                                    disabled={isDeleted}
                                                    title={
                                                        isDeleted
                                                            ? t('detail.disabledReason.orderDeleted', 'Order is deleted')
                                                            : undefined
                                                    }
                                                >
                                                    {t('detail.allocateOutput', 'Allocate output')}
                                                </MuiButton>
                                            )}
                                        {processCompleted &&
                                            !isCompleted &&
                                            allAllocated && (
                                                <MuiButton
                                                    variant="contained"
                                                    color="success"
                                                    size="small"
                                                    startIcon={<CheckIcon />}
                                                    onClick={completeOrder}
                                                    disabled={isDeleted}
                                                    title={
                                                        isDeleted
                                                            ? t('detail.disabledReason.orderDeleted', 'Order is deleted')
                                                            : undefined
                                                    }
                                                >
                                                    {t('detail.completeOrder', 'Complete order')}
                                                </MuiButton>
                                            )}
                                        {isCompleted && (
                                            <MuiButton
                                                variant="outlined"
                                                size="small"
                                                startIcon={<PreviewIcon />}
                                                onClick={() =>
                                                    setAllocateOpen(true)
                                                }
                                            >
                                                {t('detail.viewAllocation', 'View allocation')}
                                            </MuiButton>
                                        )}
                                    </Box>
                                    <Properties>
                                        <Property label={t('detail.field.nomenclature', 'Nomenclature')}>
                                            <DetailLinkText
                                                id={data.processNomenclatureId}
                                                text={
                                                    data.processNomenclatureName
                                                }
                                                onClick={() =>
                                                    setSubDetail(
                                                        <NomenclatureDetail
                                                            readonly={true}
                                                            id={
                                                                data.processNomenclatureId
                                                            }
                                                            api={
                                                                Api.nomenclatures
                                                            }
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
                                        <Property
                                            label={t('detail.field.amount', 'Amount')}
                                            value={t('detail.field.amountValue', '{{count}} pcs', { count: data.amount as number })}
                                            mono
                                        />
                                        <Property label={t('detail.field.process', 'Process')} full>
                                            <DetailLinkText
                                                id={data.processId}
                                                text={data.processName}
                                                onClick={(procId) =>
                                                    setSubDetail(
                                                        <ProcessDetail
                                                            readonly={true}
                                                            processId={procId}
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
                                        <Property
                                            label={t('detail.field.start', 'Start')}
                                            value={formatLocalDate(data.startDate)}
                                            mono
                                        />
                                        <Property
                                            label={t('detail.field.due', 'Due')}
                                            value={formatLocalDate(data.dueDate)}
                                            mono
                                        />
                                        {data.description && (
                                            <Property
                                                label={t('detail.field.description', 'Description')}
                                                value={data.description}
                                                multiline
                                                full
                                            />
                                        )}
                                    </Properties>
                                </Box>
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
                        content={({ values, handleChange }) => {
                            const amountInvalid =
                                values.amount != null &&
                                Number(values.amount) <= 0
                            return (
                                <Box>
                                    <EditorSection
                                        number={1}
                                        title={t('detail.editor.section.identity', 'Identity')}
                                        done={false}
                                    >
                                        <Field
                                            name="number"
                                            label={t('detail.editor.field.orderNumber', 'Order #')}
                                            value={
                                                (values.number as string) ?? ''
                                            }
                                            onChange={handleChange}
                                        />
                                        <Field
                                            full
                                            kind="textarea"
                                            name="description"
                                            label={t('detail.editor.field.description', 'Description')}
                                            rows={2}
                                            value={
                                                (values.description as string) ??
                                                ''
                                            }
                                            onChange={handleChange}
                                        />
                                    </EditorSection>

                                    <EditorSection
                                        number={2}
                                        title={t('detail.editor.section.process', 'Process')}
                                        done={false}
                                    >
                                        <Box>
                                            <Typography
                                                sx={{
                                                    fontFamily:
                                                        'var(--font-mono)',
                                                    fontSize: 11,
                                                    fontWeight: 700,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.07em',
                                                    color: 'var(--ink-3)',
                                                    mb: 0.5,
                                                }}
                                            >
                                                {t('detail.editor.field.technologyProcess', 'Technology process')}
                                            </Typography>
                                            <HierarchyPicker
                                                data={hierarchy}
                                                value={values.processId}
                                                onChange={(v) =>
                                                    handleChange({
                                                        target: {
                                                            name: 'processId',
                                                            value: v,
                                                        },
                                                    })
                                                }
                                            />
                                        </Box>
                                        <Field
                                            type="number"
                                            name="amount"
                                            label={t('detail.editor.field.amount', 'Amount')}
                                            required
                                            value={
                                                (values.amount as number) ??
                                                ''
                                            }
                                            onChange={(e) =>
                                                handleChange({
                                                    target: {
                                                        name: 'amount',
                                                        value: numberOrNull(
                                                            e.target.value,
                                                        ),
                                                    },
                                                })
                                            }
                                            state={
                                                amountInvalid
                                                    ? 'invalid'
                                                    : 'pristine'
                                            }
                                            help={
                                                amountInvalid
                                                    ? t(
                                                          'detail.editor.field.amountInvalid',
                                                          'Amount must be greater than 0.',
                                                      )
                                                    : undefined
                                            }
                                        />
                                    </EditorSection>

                                    <EditorSection
                                        number={3}
                                        title={t('detail.editor.section.schedule', 'Schedule')}
                                        done={false}
                                    >
                                        <Field
                                            type="date"
                                            name="startDate"
                                            label={t('detail.editor.field.startDate', 'Start Date')}
                                            value={toDateInputValue(
                                                values.startDate ??
                                                    parseUtcDate(
                                                        data?.startDate,
                                                    ),
                                            )}
                                            onChange={(e) =>
                                                handleChange({
                                                    target: {
                                                        name: 'startDate',
                                                        value: fromDateInputValue(
                                                            e.target.value,
                                                        ),
                                                    },
                                                })
                                            }
                                        />
                                        <Field
                                            type="date"
                                            name="dueDate"
                                            label={t('detail.editor.field.dueDate', 'Due Date')}
                                            value={toDateInputValue(
                                                values.dueDate ??
                                                    parseUtcDate(
                                                        data?.dueDate,
                                                    ),
                                            )}
                                            onChange={(e) =>
                                                handleChange({
                                                    target: {
                                                        name: 'dueDate',
                                                        value: fromDateInputValue(
                                                            e.target.value,
                                                        ),
                                                    },
                                                })
                                            }
                                        />
                                    </EditorSection>
                                </Box>
                            )
                        }}
                    />
                }
                relations={
                    <OrderTabs
                        id={effectiveId as UUID}
                        api={props.api}
                        order={data}
                        onDetailSelected={setSubDetail}
                    />
                }
            />
        </>
    )
}
