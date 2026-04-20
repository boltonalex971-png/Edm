import api from '@features/api/api.ts'
import Api from '@features/api/api.ts'
import { DetailLinkText } from '@logistics/components/DropDownCell.tsx'
import { LinkableComboBox } from '@logistics/components/DropDowns.tsx'
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
import { ItemGenealogyTree } from '@logistics/components/items/ItemGenealogyTree.tsx'
import '@logistics/components/items/ItemGenealogyTree.css'
import { OrderDetail } from '@logistics/components/orders/OrderDetail.tsx'
import { OrderTabs } from '@logistics/components/orders/OrderTabs.tsx'
import { SupplyDetail } from '@logistics/components/supplies/SupplyDetail.tsx'
import {
    type DetailEventHandler,
    type Item,
    type Nomenclature,
    Order,
    type TareType,
} from '@logistics/data/types'
import { useGet } from '@logistics/hooks/hooks.ts'
import { formatUnits } from '@logistics/utils/format.ts'
import { Button } from '@progress/kendo-react-buttons'
import { DatePicker, DateTimePicker } from '@progress/kendo-react-dateinputs'
import { ComboBox, ComboBoxProps } from '@progress/kendo-react-dropdowns'
import { Field } from '@progress/kendo-react-form'
import { Input, NumericTextBox, TextArea } from '@progress/kendo-react-inputs'
import axios from 'axios'
import type React from 'react'
import { type EffectCallback, useEffect, useState } from 'react'
import { Diagram3, Link45deg } from 'react-bootstrap-icons'

export interface ItemDetailProps extends DetailProps {
    onUpdate?: DetailEventHandler
    type: string
}

export function ItemDetail({ id, title = 'Item', ...props }: ItemDetailProps) {
    const [alert, setAlert] = useState<AlertState>()
    const [subDetail, setSubDetail] = useState<React.ReactElement>()
    useEffect(setSubDetail as EffectCallback, [id])
    //const [[processes]] = useGet<any[]>(api.processes, []);
    const [[taretypes]] = useGet<TareType[]>(`${Api.taretypes}`, [])
    const [[nomenclatures]] = useGet<Nomenclature[]>(`${Api.nomenclatures}`, [])
    let [[data, setData], loading, error] = useGet<Item>(
        `${Api.items}/${id || EMPTY_GUID}`,
        [id],
    )
    if (!data || data.id === EMPTY_GUID) {
        data = { ...data, name: '', description: '' } as Item
    }

    const selectedNomenclature = nomenclatures?.find(
        (n) => n.id === data?.nomenclatureId,
    )
    const selectedTareType = taretypes?.find(
        (t) => t.id === data?.tareTareTypeId,
    )
    const showAddress =
        (selectedTareType?.sizeX ?? 0) > 0 &&
        (selectedNomenclature?.countable ?? false) === true

    // Reset alert after open item changed
    useEffect(() => setAlert(undefined), [id])

    return (
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
                                />
                                <dl className="item-info">
                                    <dt className="item-info-label">
                                        Nomenclature
                                    </dt>
                                    <dd className="item-info-value">
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
                                        ) : (
                                            <span className="item-info-value--muted">
                                                —
                                            </span>
                                        )}
                                        {selectedNomenclature?.category && (
                                            <span
                                                className="item-info-value--muted"
                                                style={{ marginLeft: 8 }}
                                            >
                                                ·{' '}
                                                {selectedNomenclature.category}
                                            </span>
                                        )}
                                        {data.isOutput ? (
                                            <span
                                                className="item-source-badge item-source-badge--output"
                                                style={{ marginLeft: 8 }}
                                                title="Produced by an order execution."
                                            >
                                                Output
                                            </span>
                                        ) : data.supplyId ? (
                                            <span
                                                className="item-source-badge item-source-badge--supply"
                                                style={{ marginLeft: 8 }}
                                                title="Received through a supply."
                                            >
                                                Supply
                                            </span>
                                        ) : null}
                                    </dd>

                                    <dt className="item-info-label">
                                        Quantity
                                    </dt>
                                    <dd className="item-info-value item-info-mono">
                                        {formatUnits(
                                            data.quantity,
                                            data.tareTareTypeUnits ??
                                                selectedTareType?.units,
                                            selectedNomenclature?.countable,
                                        )}
                                    </dd>

                                    {data.serialNo && (
                                        <>
                                            <dt className="item-info-label">
                                                Serial No
                                            </dt>
                                            <dd className="item-info-value item-info-mono">
                                                {data.serialNo}
                                            </dd>
                                        </>
                                    )}

                                    {(data.tareBarcode ||
                                        data.tareTareTypeName) && (
                                        <>
                                            <dt className="item-info-label">
                                                Tare
                                            </dt>
                                            <dd className="item-info-value">
                                                {data.tareTareTypeName && (
                                                    <span>
                                                        {data.tareTareTypeName}
                                                    </span>
                                                )}
                                                {data.tareBarcode && (
                                                    <span className="item-info-mono">
                                                        {data.tareTareTypeName
                                                            ? ' · '
                                                            : ''}
                                                        {data.tareBarcode}
                                                    </span>
                                                )}
                                            </dd>
                                        </>
                                    )}

                                    {showAddress && data.address != null && (
                                        <>
                                            <dt className="item-info-label">
                                                Address
                                            </dt>
                                            <dd className="item-info-value item-info-mono">
                                                #{data.address}
                                            </dd>
                                        </>
                                    )}

                                    {data.supplyId && (
                                        <>
                                            <dt className="item-info-label">
                                                Supply
                                            </dt>
                                            <dd className="item-info-value">
                                                <DetailLinkText
                                                    id={data.supplyId}
                                                    text={
                                                        data.supplyName ||
                                                        `${String(
                                                            data.supplyId,
                                                        ).slice(0, 8)}…`
                                                    }
                                                    onClick={() =>
                                                        setSubDetail(
                                                            <SupplyDetail
                                                                readonly={true}
                                                                id={
                                                                    data.supplyId
                                                                }
                                                                api={
                                                                    Api.supplies
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
                                            </dd>
                                        </>
                                    )}

                                    {(() => {
                                        const orderBlock = data.orderId && (
                                            <>
                                                <dt className="item-info-label">
                                                    Order
                                                </dt>
                                                <dd className="item-info-value">
                                                    <DetailLinkText
                                                        id={data.orderId}
                                                        text={
                                                            data.orderName ||
                                                            `${String(
                                                                data.orderId,
                                                            ).slice(0, 8)}…`
                                                        }
                                                        onClick={() =>
                                                            setSubDetail(
                                                                <OrderDetail
                                                                    readonly={
                                                                        true
                                                                    }
                                                                    id={
                                                                        data.orderId
                                                                    }
                                                                    api={
                                                                        Api.orders
                                                                    }
                                                                    path={
                                                                        props.path
                                                                    }
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
                                                </dd>
                                            </>
                                        )
                                        const processBlock = data.processId && (
                                            <>
                                                <dt className="item-info-label">
                                                    {data.isOutput
                                                        ? 'Produced by'
                                                        : 'Process'}
                                                </dt>
                                                <dd className="item-info-value">
                                                    <DetailLinkText
                                                        id={data.processId}
                                                        text={
                                                            data.processName ||
                                                            `${String(
                                                                data.processId,
                                                            ).slice(0, 8)}…`
                                                        }
                                                        onClick={() =>
                                                            setSubDetail(
                                                                <ProcessDetail
                                                                    readonly={
                                                                        true
                                                                    }
                                                                    processId={
                                                                        data.processId
                                                                    }
                                                                    api={
                                                                        Api.processes
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
                                                </dd>
                                            </>
                                        )
                                        return data.isOutput ? (
                                            <>
                                                {processBlock}
                                                {orderBlock}
                                            </>
                                        ) : (
                                            <>
                                                {orderBlock}
                                                {processBlock}
                                            </>
                                        )
                                    })()}

                                    <dt className="item-info-label">Id</dt>
                                    <dd className="item-info-value item-info-mono item-info-value--muted">
                                        {String(data.id)}
                                    </dd>

                                    {data.isActive === false && (
                                        <>
                                            <dt className="item-info-label">
                                                Status
                                            </dt>
                                            <dd className="item-info-value">
                                                <span className="item-info-badge">
                                                    Inactive
                                                </span>
                                            </dd>
                                        </>
                                    )}
                                </dl>
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
                                Enter supply data
                            </legend>
                            <div
                                className="mb-2"
                                style={{
                                    display: 'flex',
                                    alignItems: 'baseline',
                                }}
                            >
                                <Field
                                    name={'nomenclatureId'}
                                    component={(p) => (
                                        <LinkableComboBox
                                            {...p}
                                            data={nomenclatures}
                                        />
                                    )}
                                    label={'Nomenclature'}
                                />
                                {/*<button onClick={() => props.onLink(api.nomenclatures)}*/}
                                {/*        style={{backgroundColor: 'transparent', border: 'transparent'}}>*/}
                                {/*    <Link45deg size={'1.4em'}/>*/}
                                {/*</button>*/}
                            </div>
                            <div
                                className="mb-2"
                                style={{
                                    display: 'flex',
                                    alignItems: 'baseline',
                                }}
                            >
                                <Field
                                    name={'tareTareTypeId'}
                                    component={(p) => (
                                        <LinkableComboBox
                                            {...p}
                                            data={taretypes}
                                        />
                                    )}
                                    label={'Tare Type'}
                                />
                                {/*<button onClick={() => props.onLink(api.taretypes)}*/}
                                {/*        style={{backgroundColor: 'transparent', border: 'transparent'}}>*/}
                                {/*    <Link45deg size={'1.4em'}/>*/}
                                {/*</button>*/}
                            </div>
                            <div className="mb-2">
                                <Field
                                    name={'tareBarcode'}
                                    component={Input}
                                    label={'Tare Barcode'}
                                />
                            </div>
                            {showAddress && (
                                <div className="mb-2">
                                    <Field
                                        name={'address'}
                                        component={NumericTextBox}
                                        label={'Address'}
                                    />
                                </div>
                            )}
                            <div className="mb-2">
                                <Field
                                    name={'serialNo'}
                                    component={Input}
                                    label={'Serial No'}
                                />
                            </div>
                            <div className="mb-2">
                                <Field
                                    name={'quantity'}
                                    component={NumericTextBox}
                                    label={'Quantity'}
                                />
                            </div>
                        </fieldset>
                    }
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
