import api from '@features/api/api.ts'
import Api from '@features/api/api.ts'
import { DetailLinkText } from '@logistics/components/DropDownCell.tsx'
import { HierarchyPicker } from '@logistics/components/HierarchyPicker.tsx'
import {
    type AlertState,
    useAlertSetter,
} from '@logistics/components/InlineAlert.tsx'
import {
    Detail,
    type DetailProps,
    EMPTY_GUID,
    Editor,
    Info,
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
import { parseUtcDate } from '@logistics/utils/format'
import { Button } from '@progress/kendo-react-buttons'
import { DatePicker, DateTimePicker } from '@progress/kendo-react-dateinputs'
import { Field } from '@progress/kendo-react-form'
import { Input, NumericTextBox, TextArea } from '@progress/kendo-react-inputs'
import axios from 'axios'
import type React from 'react'
import { type EffectCallback, useEffect, useState } from 'react'
import { Diagram3 } from 'react-bootstrap-icons'
import { useNavigate } from 'react-router-dom'

export interface OrderDetailProps extends DetailProps {
    onUpdate?: DetailEventHandler
    type: string
}

export function OrderDetail({
    id,
    title = 'Order',
    ...props
}: OrderDetailProps) {
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
        ? 'Order is deleted'
        : isCompleted
          ? 'Order is completed'
          : processCompleted
            ? 'Process is already completed'
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
                        ? 'The order executed and completed'
                        : 'The order executed successfully',
                })
            })
            .catch((e) => {
                setAlert({
                    message:
                        e.response.data.detail ||
                        e.response.statusText ||
                        'Error',
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
                    message:
                        e.response?.data?.detail ||
                        e.response?.statusText ||
                        'Failed to complete the order',
                    status: 'danger',
                })
            })
    }
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
                icon={<Diagram3 title="Order" />}
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
                                <>
                                    {data?.number && (
                                        <h3
                                            style={{
                                                margin: 0,
                                                marginBottom: '0.5rem',
                                            }}
                                        >
                                            #{data.number}
                                        </h3>
                                    )}
                                    {data?.status && (
                                        <div
                                            style={{
                                                display: 'flex',
                                                gap: '0.6rem',
                                                alignItems: 'center',
                                                padding: '0.3rem 0.6rem',
                                                marginBottom: '0.5rem',
                                                borderRadius: 4,
                                                background: '#f5f5f5',
                                                fontSize: '0.9rem',
                                            }}
                                        >
                                            <strong>
                                                {data.status ===
                                                'OutputsPending'
                                                    ? 'Outputs pending'
                                                    : data.status}
                                            </strong>
                                            {data.executor && (
                                                <span style={{ color: '#555' }}>
                                                    · Executed by{' '}
                                                    <strong>
                                                        {data.executor}
                                                    </strong>
                                                </span>
                                            )}
                                        </div>
                                    )}
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignContent: 'baseline',
                                        }}
                                    >
                                        <div>
                                            <p>
                                                Nomenclature{' '}
                                                <DetailLinkText
                                                    id={
                                                        data.processNomenclatureId
                                                    }
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
                                                                //onUpdate={itemUpdate}
                                                            />,
                                                        )
                                                    }
                                                />{' '}
                                                {data.amount} pcs
                                            </p>
                                            <p>
                                                using{' '}
                                                <DetailLinkText
                                                    id={data.processId}
                                                    text={data.processName}
                                                    onClick={(
                                                        procId,
                                                        onUpdate,
                                                    ) =>
                                                        setSubDetail(
                                                            <ProcessDetail
                                                                readonly={true}
                                                                processId={
                                                                    procId
                                                                }
                                                                api={
                                                                    Api.processes
                                                                }
                                                                onClose={() =>
                                                                    setSubDetail(
                                                                        undefined,
                                                                    )
                                                                }
                                                                //onUpdate={onUpdate}
                                                            />,
                                                        )
                                                    }
                                                />{' '}
                                                process
                                            </p>
                                            {/*{data.startDate && <p>Start {data.startDate?.toLocaleDateString()}</p> }*/}
                                            {/*{data.dueDate && <p>must be done until {data.dueDate?.toLocaleDateString()}</p> }*/}
                                        </div>
                                        <div>
                                            {!processCompleted && (
                                                <Button
                                                    type="button"
                                                    themeColor="primary"
                                                    icon="play"
                                                    className="mb-2"
                                                    onClick={startOrder}
                                                    disabled={startDisabled}
                                                    title={startDisabledReason}
                                                >
                                                    Start operation
                                                </Button>
                                            )}
                                            {processCompleted &&
                                                !isCompleted &&
                                                !allAllocated && (
                                                    <Button
                                                        type="button"
                                                        themeColor="primary"
                                                        icon="grid-layout"
                                                        className="mb-2"
                                                        onClick={() =>
                                                            setAllocateOpen(
                                                                true,
                                                            )
                                                        }
                                                        disabled={isDeleted}
                                                        title={
                                                            isDeleted
                                                                ? 'Order is deleted'
                                                                : undefined
                                                        }
                                                    >
                                                        Allocate output
                                                    </Button>
                                                )}
                                            {processCompleted &&
                                                !isCompleted &&
                                                allAllocated && (
                                                    <Button
                                                        type="button"
                                                        themeColor="success"
                                                        icon="check"
                                                        className="mb-2"
                                                        onClick={completeOrder}
                                                        disabled={isDeleted}
                                                        title={
                                                            isDeleted
                                                                ? 'Order is deleted'
                                                                : undefined
                                                        }
                                                    >
                                                        Complete order
                                                    </Button>
                                                )}
                                            {isCompleted && (
                                                <Button
                                                    type="button"
                                                    icon="preview"
                                                    className="mb-2"
                                                    onClick={() =>
                                                        setAllocateOpen(true)
                                                    }
                                                >
                                                    View allocation
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </>
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
                        content={
                            <fieldset className={'k-form-fieldset'}>
                                <legend className={'k-form-legend'}>
                                    Enter order data
                                </legend>
                                <div
                                    className="mb-2"
                                    style={{ width: '400px' }}
                                >
                                    <Field
                                        name={'number'}
                                        component={Input}
                                        label={'Order #'}
                                    />
                                </div>
                                <div
                                    className="mb-2"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'baseline',
                                    }}
                                >
                                    <Field
                                        name={'processId'}
                                        component={(p) => (
                                            <HierarchyPicker
                                                data={hierarchy}
                                                value={p.value}
                                                onChange={(v) =>
                                                    p.onChange({ value: v })
                                                }
                                            />
                                        )}
                                        label="Process"
                                    />
                                </div>
                                <div className="mb-2">
                                    <label className="k-label">
                                        Description
                                    </label>
                                    <Field
                                        name={'description'}
                                        component={TextArea}
                                        label={'Description'}
                                    />
                                </div>
                                <div
                                    className="mb-2"
                                    style={{ width: '400px' }}
                                >
                                    <Field
                                        name={'amount'}
                                        component={NumericTextBox}
                                        label={'Amount'}
                                        validator={(value: number) =>
                                            value > 0
                                                ? ''
                                                : 'Amount must be greater than 0'
                                        }
                                    />
                                </div>
                                <div
                                    className="mb-2"
                                    style={{ width: '400px' }}
                                >
                                    <Field
                                        name={'startDate'}
                                        component={(o) => (
                                            <DatePicker
                                                {...o}
                                                placeholder={''}
                                                value={parseUtcDate(
                                                    data?.startDate,
                                                )}
                                            />
                                        )}
                                        label={'Start Date'}
                                    />
                                </div>
                                <div
                                    className="mb-2"
                                    style={{ width: '400px' }}
                                >
                                    <Field
                                        name={'dueDate'}
                                        component={(o) => (
                                            <DatePicker
                                                {...o}
                                                placeholder={''}
                                                value={parseUtcDate(
                                                    data?.dueDate,
                                                )}
                                            />
                                        )}
                                        label={'Due Date'}
                                    />
                                </div>
                            </fieldset>
                        }
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
