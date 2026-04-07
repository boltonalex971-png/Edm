import React, {type EffectCallback, useEffect, useState} from 'react';
import {Button} from "@progress/kendo-react-buttons";
import {Diagram3, Link45deg} from "react-bootstrap-icons";
import api from "@features/api/api.ts";
import {useGet} from "@logistics/hooks/hooks.ts";
import {type DetailEventHandler, Item, Nomenclature, Order, TareType} from "@logistics/data/types";
import {Input, NumericTextBox, TextArea} from "@progress/kendo-react-inputs";
import {DetailLinkText} from "@logistics/components/DropDownCell.tsx";
import Api from "@features/api/api.ts";
import {ProcessDetail} from "@logistics/components/config/process/Processes.tsx";
import {NomenclatureDetail} from "@logistics/components/config/nomenclature/Nomenclatures.tsx";
import {Detail, type DetailProps, Editor, EMPTY_GUID, Info} from "@logistics/components/MasterDetail.tsx";
import {Field} from "@progress/kendo-react-form";
import {DatePicker, DateTimePicker} from "@progress/kendo-react-dateinputs";
import {OrderTabs} from "@logistics/components/orders/OrderTabs.tsx";
import axios from "axios";
import {AlertState, InlineAlert} from "@logistics/components/InlineAlert.tsx";
import {ComboBox, ComboBoxProps} from "@progress/kendo-react-dropdowns";
import {LinkableComboBox} from "@logistics/components/DropDowns.tsx";
import { ItemLinksTable } from '@logistics/components/items/ItemLinksTable.tsx'

export interface ItemDetailProps extends DetailProps {
    onUpdate?: DetailEventHandler
    type: string,
}

export function ItemDetail({id, title = 'Item', ...props}: ItemDetailProps) {
    const [alert, setAlert] = useState<AlertState>();
    const [subDetail, setSubDetail] = useState<React.ReactElement>();
    useEffect(setSubDetail as EffectCallback, [id]);
    //const [[processes]] = useGet<any[]>(api.processes, []);
    const [[taretypes]] = useGet<TareType[]>(`${Api.taretypes}`, []);
    const [[nomenclatures]] = useGet<Nomenclature[]>(`${Api.nomenclatures}`, []);
    let [[data, setData], loading, error] = useGet<Item>(`${Api.supplies}/${id || EMPTY_GUID}`, [id]);
    if (!data || data.id === EMPTY_GUID) {
        data = {...data, name: '', description: ''} as Item
    }

    const selectedNomenclature = nomenclatures?.find(n => n.id === data?.nomenclatureId);
    const selectedTareType = taretypes?.find(t => t.id === data?.tareTareTypeId);
    const showAddress =
        (selectedTareType?.dimensions ?? 0) > 0 &&
        (selectedNomenclature?.countable ?? false) === true;

    // Reset alert after open item changed
    useEffect(() => setAlert(undefined), [id]);
    
    return (
        <Detail {...props}
                id={id}
                icon={<Diagram3 title='Order'/>}
                title={title}
                subTitle={data.description}
                loading={loading}
                error={error as string}
                data={data}
                subDetail={subDetail}
                card={
                    <Info
                        content={data &&
                            <>
                                <InlineAlert state={alert} id={id} onClose={() => setAlert(undefined)}></InlineAlert>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignContent: 'baseline'
                                }}>
                                    <div>
                                        <p>Nomenclature <DetailLinkText
                                            id={data.nomenclatureId}
                                            text={data.nomenclatureName}
                                            onClick={() => setSubDetail(
                                                <NomenclatureDetail
                                                    readonly={true}
                                                    id={data.nomenclatureId}
                                                    api={Api.nomenclatures}
                                                    onClose={() => setSubDetail(undefined)}
                                                    //onUpdate={itemUpdate}
                                                />
                                            )}
                                        /> {data.quantity} pcs
                                        </p>
                                        {data.tareBarcode && (
                                            <p>
                                                Tare: {data.tareTareTypeName} / {data.tareBarcode}
                                            </p>
                                        )}
                                        {showAddress && data.address != null && (
                                            <p>Address: {data.address}</p>
                                        )}
                                        {/*<p>using <DetailLinkText*/}
                                        {/*    id={data.processId}*/}
                                        {/*    text={data.processName}*/}
                                        {/*    onClick={(procId, onUpdate) => setSubDetail(*/}
                                        {/*        <ProcessDetail*/}
                                        {/*            readonly={true}*/}
                                        {/*            processId={procId}*/}
                                        {/*            api={Api.processes}*/}
                                        {/*            onClose={() => setSubDetail(undefined)}*/}
                                        {/*            //onUpdate={onUpdate}*/}
                                        {/*        />*/}
                                        {/*    )}*/}
                                        {/*/> process*/}
                                        {/*</p>*/}
                                        {/*{data.startDate && <p>Start {data.startDate?.toLocaleDateString()}</p> }*/}
                                        {/*{data.dueDate && <p>must be done until {data.dueDate?.toLocaleDateString()}</p> }*/}
                                    </div>
                                </div>
                            </>
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
                                <legend className={'k-form-legend'}>Enter supply data</legend>
                                <div className="mb-2" style={{display: 'flex', alignItems: 'baseline'}}>
                                    <Field name={'nomenclatureId'}
                                           component={(p) =>
                                               <LinkableComboBox {...p} data={nomenclatures}/>
                                           }
                                           label={'Nomenclature'}
                                    />
                                    {/*<button onClick={() => props.onLink(api.nomenclatures)}*/}
                                    {/*        style={{backgroundColor: 'transparent', border: 'transparent'}}>*/}
                                    {/*    <Link45deg size={'1.4em'}/>*/}
                                    {/*</button>*/}
                                </div>
                                <div className="mb-2" style={{display: 'flex', alignItems: 'baseline'}}>
                                    <Field name={'tareTareTypeId'}
                                           component={(p) =>
                                               <LinkableComboBox {...p} data={taretypes}/>
                                           }
                                           label={'Tare Type'}
                                    />
                                    {/*<button onClick={() => props.onLink(api.taretypes)}*/}
                                    {/*        style={{backgroundColor: 'transparent', border: 'transparent'}}>*/}
                                    {/*    <Link45deg size={'1.4em'}/>*/}
                                    {/*</button>*/}
                                </div>
                                <div className="mb-2">
                                    <Field name={'shipment'} component={Input} label={'Shipment'}/>
                                </div>
                                <div className="mb-2">
                                    <Field name={'shipmentExternalId'} component={Input} label={'Shipment Id'}/>
                                </div>
                                <div className="mb-2">
                                    <Field name={'tareBarcode'} component={Input} label={'Tare Barcode'}/>
                                </div>
                                {showAddress && (
                                    <div className="mb-2">
                                        <Field name={'address'} component={NumericTextBox} label={'Address'}/>
                                    </div>
                                )}
                                <div className="mb-2">
                                    <Field name={'serialNo'} component={Input} label={'Serial No'}/>
                                </div>
                                <div className="mb-2">
                                    <Field name={'quantity'} component={NumericTextBox} label={'Quantity'}/>
                                </div>
                            </fieldset>
                        }
                    />
                }
                relations={<ItemLinksTable itemId={id as any} />}
        />
    );
}
