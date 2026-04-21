import api from '@features/api/api.ts'
import Api from '@features/api/api.ts'
import { DetailLinkText } from '@logistics/components/DropDownCell.tsx'
import {
    type AlertState,
    InlineAlert,
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
import { useGet } from '@logistics/hooks/hooks.ts'
import { Button } from '@progress/kendo-react-buttons'
import { DatePicker, DateTimePicker } from '@progress/kendo-react-dateinputs'
import {
    DropDownTree,
    type DropDownTreeChangeEvent,
    DropDownTreeCloseEvent,
} from '@progress/kendo-react-dropdowns'
import { Field } from '@progress/kendo-react-form'
import { Input, NumericTextBox, TextArea } from '@progress/kendo-react-inputs'
import axios from 'axios'
import type React from 'react'
import { type EffectCallback, useEffect, useMemo, useState } from 'react'
import { Diagram3 } from 'react-bootstrap-icons'
import { useNavigate } from 'react-router-dom'

type ProcessTreeItem = TreeDataItem & {
    disabled?: boolean
    items?: ProcessTreeItem[]
}

function markFoldersDisabled(
    nodes: TreeDataItem[] | undefined,
): ProcessTreeItem[] {
    if (!nodes) {
        return []
    }
    return nodes.map((n) => ({
        ...(n as any),
        disabled: (n as any).isFolder === true,
        items: markFoldersDisabled((n as any).items),
    }))
}

function findTreeItemById(
    nodes: ProcessTreeItem[] | undefined,
    id: UUID | undefined,
): ProcessTreeItem | null {
    if (!nodes || !id) {
        return null
    }
    for (const n of nodes) {
        if ((n as any).id === id) {
            return n
        }
        const child = findTreeItemById(n.items, id)
        if (child) {
            return child
        }
    }
    return null
}

export interface OrderDetailProps extends DetailProps {
    onUpdate?: DetailEventHandler
    type: string
}

export function OrderDetail({
    id,
    title = 'Order',
    ...props
}: OrderDetailProps) {
    const [alert, setAlert] = useState<AlertState>()
    const [subDetail, setSubDetail] = useState<React.ReactElement>()
    const [allocateOpen, setAllocateOpen] = useState(false)
    const navigate = useNavigate()
    useEffect(setSubDetail as EffectCallback, [id])
    const [[hierarchy]] = useGet<TreeDataItem[]>(
        `${Api.processes}/hierarchy?kind=Technology`,
        [],
    )
    //const processTree = useMemo(() => markFoldersDisabled(hierarchy), [hierarchy])
    // const [[kinds]] = useGet<string[]>(`${Api.processes}/kinds`, []);
    // const [[noms]] = useGet<Item[]>(`${Api.nomenclatures}`, []);
    const [reloadToken, setReloadToken] = useState(0)
    let [[data, setData], loading, error] = useGet<Order>(
        `${Api.orders}/${id || EMPTY_GUID}`,
        [id, reloadToken],
    )
    // After a Create, the prop `id` stays undefined (the panel is not
    // route-driven), but `data.id` is set to the new GUID via setData.
    // Fall back to data.id so the Tabs and the operations fetch see it.
    const effectiveId =
        id ||
        (data?.id && data.id !== EMPTY_GUID ? (data.id as UUID) : undefined)
    const [[orderProcesses]] = useGet<OrderProcess[]>(
        effectiveId
            ? `${Api.orders}/${effectiveId}/operations`
            : `${Api.orders}/${EMPTY_GUID}/operations`,
        [effectiveId, reloadToken],
    )
    const [[outputItems]] = useGet<OrderOutputItems>(
        effectiveId
            ? `${Api.orders}/${effectiveId}/output-items`
            : `${Api.orders}/${EMPTY_GUID}/output-items`,
        [effectiveId, reloadToken],
    )
    if (!data || data.id === EMPTY_GUID) {
        data = { ...data, name: '', description: '' } as Order
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
                setReloadToken((x) => x + 1)
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
    // Reset alert after open order changed
    useEffect(() => setAlert(undefined), [id])

    return (
        <>
        {allocateOpen && effectiveId && (
            <AllocateOutputWindow
                orderId={effectiveId}
                onClose={() => setAllocateOpen(false)}
                onChanged={() => setReloadToken((x) => x + 1)}
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
                                <InlineAlert
                                    state={alert}
                                    id={id}
                                    onClose={() => setAlert(undefined)}
                                ></InlineAlert>
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
                                                onClick={(procId, onUpdate) =>
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
                                                        setAllocateOpen(true)
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
                                style={{
                                    display: 'flex',
                                    alignItems: 'baseline',
                                    width: '600px',
                                }}
                            >
                                <Field
                                    name={'processId'}
                                    component={(p) => (
                                        <DropDownTree
                                            {...p}
                                            data={hierarchy}
                                            dataItemKey={'id'}
                                            textField={'name'}
                                            subItemsField={'items'}
                                            expandField={'expanded'}
                                            value={findTreeItemById(
                                                hierarchy,
                                                p.value as any,
                                            )}
                                            onChange={(
                                                e: DropDownTreeChangeEvent,
                                            ) => {
                                                const selected =
                                                    e.value as ProcessTreeItem | null
                                                if (
                                                    !selected ||
                                                    selected?.isFolder
                                                ) {
                                                    return
                                                }

                                                p.onChange({
                                                    value: (selected as any)
                                                        .id as UUID,
                                                })
                                            }}
                                        />
                                    )}
                                    label="Process"
                                />
                                {/*<button onClick={() => props.onLink(api.processes)}*/}
                                {/*        style={{backgroundColor: 'transparent', border: 'transparent'}}>*/}
                                {/*    <Link45deg size={'1.4em'}/>*/}
                                {/*</button>*/}
                            </div>
                            <div className="mb-2">
                                <label className="k-label">Description</label>
                                <Field
                                    name={'description'}
                                    component={TextArea}
                                    label={'Description'}
                                />
                            </div>
                            <div className="mb-2" style={{ width: '400px' }}>
                                <Field
                                    name={'amount'}
                                    component={NumericTextBox}
                                    label={'Amount'}
                                />
                            </div>
                            <div className="mb-2" style={{ width: '400px' }}>
                                <Field
                                    name={'startDate'}
                                    component={(o) => (
                                        <DatePicker
                                            {...o}
                                            placeholder={''}
                                            value={
                                                data?.startDate &&
                                                new Date(data.startDate)
                                            }
                                        />
                                    )}
                                    label={'Start Date'}
                                />
                            </div>
                            <div className="mb-2" style={{ width: '400px' }}>
                                <Field
                                    name={'dueDate'}
                                    component={(o) => (
                                        <DatePicker
                                            {...o}
                                            placeholder={''}
                                            value={
                                                data?.dueDate &&
                                                new Date(data.dueDate)
                                            }
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
