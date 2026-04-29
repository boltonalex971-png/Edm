import api from '@features/api/api'
import Api from '@features/api/api'
import {
    Detail,
    type DetailProps,
    EMPTY_GUID,
    Editor,
    Info,
} from '@logistics/components/MasterDetail'
import { BatchItemCreate } from '@logistics/components/items/BatchItemCreate'
import { ItemDetail } from '@logistics/components/items/ItemDetail'
import { TareDetail } from '@logistics/components/tare/TareDetail'
import { TareItemsPanel } from '@logistics/components/tare/TareItemsPanel'
import type { DetailEventHandler, Supply, UUID } from '@logistics/data/types'
import { useGet, useRefreshToken } from '@logistics/hooks/hooks'
import { Button } from '@progress/kendo-react-buttons'
import { Field } from '@progress/kendo-react-form'
import { Input } from '@progress/kendo-react-inputs'
import type React from 'react'
import { type EffectCallback, useEffect, useState } from 'react'
import { Diagram3 } from 'react-bootstrap-icons'

export interface SupplyDetailProps extends DetailProps {
    onUpdate?: DetailEventHandler
    type?: string
}

export function SupplyDetail({
    id,
    title = 'Supply',
    ...props
}: SupplyDetailProps) {
    const [subDetail, setSubDetail] = useState<React.ReactElement>()
    useEffect(setSubDetail as EffectCallback, [id])
    const [refreshToken, refresh] = useRefreshToken()

    let [[data, setData], loading, error] = useGet<Supply>(
        `${api.supplies}/${id || EMPTY_GUID}`,
        [id],
    )
    if (!data || data.id === EMPTY_GUID) {
        data = { ...data, name: '', description: '' } as any
    }

    const supplyId = (id as UUID) || (data.id as UUID)

    return (
        <Detail
            {...props}
            id={id}
            icon={<Diagram3 title="Supply" />}
            title={title}
            subTitle={data.shipment || data.barcode}
            loading={loading}
            error={error as string}
            data={data as any}
            subDetail={subDetail}
            card={
                <Info
                    content={
                        <>
                            {data.barcode && <p>Barcode: {data.barcode}</p>}
                            {data.shipment && <p>Shipment: {data.shipment}</p>}
                            {data.shipmentExternalId && (
                                <p>Shipment Id: {data.shipmentExternalId}</p>
                            )}
                            {(data as any).metaCreated && (
                                <p>Created: {(data as any).metaCreated}</p>
                            )}
                        </>
                    }
                />
            }
            editor={
                <Editor
                    type={props.type || 'none'}
                    api={props.api}
                    path={props.path}
                    onChange={props.onChange}
                    data={data as any}
                    setData={setData}
                    onUpdate={props.onUpdate}
                    content={
                        <fieldset className={'k-form-fieldset'}>
                            <legend className={'k-form-legend'}>
                                Enter supply data
                            </legend>
                            <div className="mb-2">
                                <Field
                                    name={'barcode'}
                                    component={Input}
                                    label={'Barcode'}
                                />
                            </div>
                            <div className="mb-2">
                                <Field
                                    name={'shipment'}
                                    component={Input}
                                    label={'Shipment'}
                                />
                            </div>
                            <div className="mb-2">
                                <Field
                                    name={'shipmentExternalId'}
                                    component={Input}
                                    label={'Shipment Id'}
                                />
                            </div>
                        </fieldset>
                    }
                />
            }
            relations={
                supplyId && supplyId !== EMPTY_GUID ? (
                    <TareItemsPanel
                        api={`${api.supplies}/${supplyId}/items`}
                        refreshToken={refreshToken}
                        onTareClick={(group) =>
                            setSubDetail(
                                <TareDetail
                                    tareId={group.tare.id}
                                    label={group.tare.barcode}
                                    onClose={() => setSubDetail(undefined)}
                                />,
                            )
                        }
                        onItemClick={(item) =>
                            setSubDetail(
                                <ItemDetail
                                    readonly={true}
                                    id={item.id}
                                    api={Api.items}
                                    onClose={() => setSubDetail(undefined)}
                                />,
                            )
                        }
                        toolbar={
                            <div className="mb-2">
                                <Button
                                    themeColor="primary"
                                    size="small"
                                    onClick={() =>
                                        setSubDetail(
                                            <BatchItemCreate
                                                supplyId={supplyId as UUID}
                                                onCreated={refresh}
                                                onClose={() =>
                                                    setSubDetail(undefined)
                                                }
                                            />,
                                        )
                                    }
                                >
                                    <span className="k-icon k-i-add" /> Add
                                    items
                                </Button>
                            </div>
                        }
                    />
                ) : null
            }
        />
    )
}
