import React, {type EffectCallback, useEffect, useState} from 'react';
import {Button} from "@progress/kendo-react-buttons";
import {Diagram3} from "react-bootstrap-icons";
import api from "@features/api/api.ts";
import {useGet} from "@logistics/hooks/hooks.ts";
import {type DetailEventHandler, Order} from "@logistics/data/types";
import {Input, NumericTextBox, TextArea} from "@progress/kendo-react-inputs";
import {DetailLinkText} from "@logistics/components/DropDownCell.tsx";
import Api from "@features/api/api.ts";
import {ProcessDetail} from "@logistics/components/config/process/Processes.tsx";
import {NomenclatureDetail} from "@logistics/components/config/nomenclature/Nomenclatures.tsx";
import {Detail, type DetailProps, Editor, EMPTY_GUID, Info} from "@logistics/components/MasterDetail.tsx";
import {Field} from "@progress/kendo-react-form";
import {DatePicker, DateTimePicker} from "@progress/kendo-react-dateinputs";
import {OrderTabs} from "@logistics/components/orders/OrderTabs.tsx";
import {LinkableComboBox} from "@logistics/components/DropDowns.tsx";

export interface OrderDetailProps extends DetailProps {
    onUpdate?: DetailEventHandler
    type: string,
}

export function OrderDetail({id, title = 'Order', ...props}: OrderDetailProps) {
    const [subDetail, setSubDetail] = useState<React.ReactElement>();
    useEffect(setSubDetail as EffectCallback, [id]);
    const [[processes]] = useGet<any[]>(api.processes, []);
    // const [[kinds]] = useGet<string[]>(`${Api.processes}/kinds`, []);
    // const [[noms]] = useGet<Item[]>(`${Api.nomenclatures}`, []);
    let [[data, setData], loading, error] = useGet<Order>(`${Api.orders}/${id || EMPTY_GUID}`, [id]);
    if (!data || data.id === EMPTY_GUID) {
        data = {...data, name: '', description: ''} as Order
    }

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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignContent: 'baseline' }}>
                            <div>
                                <p>Nomenclature <DetailLinkText
                                    id={data.processNomenclatureId}
                                    text={data.processNomenclatureName}
                                    onClick={() => setSubDetail(
                                        <NomenclatureDetail
                                            readonly={true}
                                            id={data.processNomenclatureId}
                                            api={Api.nomenclatures}
                                            onClose={() => setSubDetail(undefined)}
                                            //onUpdate={itemUpdate}
                                        />
                                    )}
                                /> {data.amount} pcs
                                </p>
                                <p>using <DetailLinkText
                                    id={data.processId}
                                    text={data.processName}
                                    onClick={(procId, onUpdate) => setSubDetail(
                                        <ProcessDetail
                                            readonly={true}
                                            processId={procId}
                                            api={Api.processes}
                                            onClose={() => setSubDetail(undefined)}
                                            //onUpdate={onUpdate}
                                        />
                                    )}
                                /> process
                                </p>
                                {/*{data.startDate && <p>Start {data.startDate?.toLocaleDateString()}</p> }*/}
                                {/*{data.dueDate && <p>must be done until {data.dueDate?.toLocaleDateString()}</p> }*/}
                            </div>
                            <div>
                                <Button type='button' themeColor='primary' icon='play' className='mb-2' onClick={() => {}} >Start operation</Button>
                            </div>
                        </div>
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
                            <legend className={'k-form-legend'}>Enter order data</legend>
                            <div className="mb-2" style={{display: 'flex', alignItems: 'baseline',  width: '600px'}}>
                                <Field name={'processId'}
                                       component={(p) =>
                                           <LinkableComboBox {...p} data={processes}/>
                                       }
                                       label='Process'
                                />
                                {/*<button onClick={() => props.onLink(api.processes)}*/}
                                {/*        style={{backgroundColor: 'transparent', border: 'transparent'}}>*/}
                                {/*    <Link45deg size={'1.4em'}/>*/}
                                {/*</button>*/}
                            </div>
                            <div className="mb-2">
                                <label className='k-label'>Description</label>
                                <Field name={'description'} component={TextArea} label={'Description'}/>
                            </div>
                            <div className="mb-2" style={{ width: '400px' }}>
                                <Field name={'amount'} component={NumericTextBox} label={'Amount'}/>
                            </div>
                            <div className="mb-2" style={{ width: '400px' }}>
                                <Field name={'startDate'} component={o =>
                                    <DatePicker {...o} placeholder={''} value={ data?.startDate && new Date(data.startDate)}/>
                                } label={'Start Date'}/>
                            </div>
                            <div className="mb-2" style={{ width: '400px' }}>
                                <Field name={'dueDate'} component={o =>
                                    <DatePicker {...o} placeholder={''} value={ data?.dueDate && new Date(data.dueDate)}/>
                                } label={'Due Date'} />
                            </div>
                        </fieldset>
                    }
                />
            }
            relations={
                <OrderTabs id={id} api={props.api} onDetailSelected={setSubDetail} />
            }
        />
    );
}
