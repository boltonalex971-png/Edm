import React, {type EffectCallback, useEffect, useState} from 'react'
import {Diagram3} from 'react-bootstrap-icons'
import {Field} from '@progress/kendo-react-form'
import {Input} from '@progress/kendo-react-inputs'
import api from '@features/api/api'
import {useGet} from '@logistics/hooks/hooks'
import {type DetailEventHandler, type Supply, type UUID} from '@logistics/data/types'
import {Detail, type DetailProps, Editor, EMPTY_GUID, Info} from '@logistics/components/MasterDetail'
import {RelationTable} from '@logistics/components/RelationTable'
import {GridColumn} from '@progress/kendo-react-grid'
import {ItemDetail} from '@logistics/components/items/ItemDetail'
import Api from '@features/api/api'

export interface SupplyDetailProps extends DetailProps {
    onUpdate?: DetailEventHandler
    type?: string
}

export function SupplyDetail({id, title = 'Supply', ...props}: SupplyDetailProps) {
    const [subDetail, setSubDetail] = useState<React.ReactElement>()
    useEffect(setSubDetail as EffectCallback, [id])

    let [[data, setData], loading, error] = useGet<Supply>(`${api.supplies}/${id || EMPTY_GUID}`, [id])
    if (!data || data.id === EMPTY_GUID) {
        data = {...data, name: '', description: ''} as any
    }

    const supplyId = (id as UUID) || (data.id as UUID)

    return (
        <Detail
            {...props}
            id={id}
            icon={<Diagram3 title='Supply'/>}
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
                            {data.shipmentExternalId && <p>Shipment Id: {data.shipmentExternalId}</p>}
                            {(data as any).metaCreated && <p>Created: {(data as any).metaCreated}</p>}
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
                            <legend className={'k-form-legend'}>Enter supply data</legend>
                            <div className="mb-2">
                                <Field name={'barcode'} component={Input} label={'Barcode'}/>
                            </div>
                            <div className="mb-2">
                                <Field name={'shipment'} component={Input} label={'Shipment'}/>
                            </div>
                            <div className="mb-2">
                                <Field name={'shipmentExternalId'} component={Input} label={'Shipment Id'}/>
                            </div>
                        </fieldset>
                    }
                />
            }
            relations={
                supplyId && supplyId !== EMPTY_GUID ? (
                    <RelationTable
                        api={`${api.supplies}/${supplyId}/items`}
                        removable={true}
                        editable={true}
                        creatable={true}
                        addMode='subdetail'
                        onRowSelected={(row) =>
                            setSubDetail(
                                <ItemDetail
                                    readonly={true}
                                    id={row?.id}
                                    api={Api.items}
                                    onClose={() => setSubDetail(undefined)}
                                />
                            )
                        }
                        subDetail={({ mode, api: relApi, dataItem, onClose, onSaved }) => (
                            <ItemDetail
                                title={mode === 'create' ? 'New Item' : 'Item'}
                                editMode={true}
                                readonly={false}
                                id={mode === 'edit' ? dataItem?.id : undefined}
                                api={mode === 'create' ? relApi : Api.items}
                                onClose={onClose as any}
                                onUpdate={onSaved as any}
                            />
                        )}
                    >
                        <GridColumn field='nomenclatureName' title='Nomenclature' width='auto'/>
                        <GridColumn field='tareTareTypeName' title='Tare' width='150'/>
                        <GridColumn field='tareBarcode' title='Tare barcode' width='140'/>
                        <GridColumn field='address' title='Address' width='90'/>
                        <GridColumn field='serialNo' title='Serial No' width='140'/>
                        <GridColumn field='quantity' title='Quantity' width='110'/>
                        <GridColumn field='tareTareTypeUnits' title='Units' width='100'/>
                    </RelationTable>
                ) : null
            }
        />
    )
}

