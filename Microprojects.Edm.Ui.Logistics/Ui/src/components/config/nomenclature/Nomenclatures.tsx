import { Field } from '@progress/kendo-react-form'
import { Input } from '@progress/kendo-react-inputs'
import {type EffectCallback, useEffect, useState} from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type {DetailEventHandler, Nomenclature, UUID } from "../../../data/types"
import Api from '@features/api/api'
import {useGet} from "@logistics/hooks/hooks";
import { useBasePath } from "@logistics/hooks/routerHooks"
import { DropDownComp } from '../../DropDownCell'
import {Detail, type DetailProps, Editor, EMPTY_GUID, Info, MasterDetail, reloadMaster} from '../../MasterDetail'
import {CardChecklist, Diagram3} from "react-bootstrap-icons";

export function Nomenclatures() {
    const type = 'nomenclature';
    const { path } = useBasePath();
    const navigate = useNavigate();
    const api = Api.nomenclatures;
    return (
        <MasterDetail
            type={type}
            api={api}
            path={path || ''}
            stubMessage='Please select a nomenclature'
            detail={
                <NomenclatureDetail
                    type={type}
                    api={api}
                    path={path || ''}
                    onChange={() => reloadMaster()}
                    onClose={() => navigate(path)}
                />
            }
        />
    );
}

export interface NomenclatureDetailProps extends DetailProps {
    onChange?: DetailEventHandler,
    onUpdate?: DetailEventHandler
    onClose: () => void,
    path: string,
    api: string,
    id?: UUID,
    type: string,
}

export function NomenclatureDetail({ id, ...props } : NomenclatureDetailProps) {
    const params = useParams<{id: string}>();
    const effectiveId = id || params.id;
    const [sub, setSub] = useState<React.ReactElement>();
    useEffect(setSub as EffectCallback, [effectiveId]);
    const [[categories]] = useGet<string[]>(`${Api.nomenclatures}/categories`, []);
    //const [[taretypes]] = useGet<string[]>(`${Api.taretypes}/types`, []);
    let [[data, setData], loading, error] = useGet<Nomenclature>(`${props.api}/${effectiveId}`, [effectiveId]);
    if (!data || data.id === EMPTY_GUID) {
        data = { ...data, name: '', description: '' } as Nomenclature
    }

    return (
        <Detail 
            api={props.api}
            path={props.path}
            onChange={props.onChange}
            onClose={props.onClose}
            id={effectiveId}
            icon={<CardChecklist title='Nomenclature' />}
            loading={loading}
            error={error as string}
            data={data}
            subDetail={sub}
            card={
                <Info 
                    content={data &&
                        <>
                            <div>
                                <p><span>Category: </span><span>{data.category}</span></p>
                                <p><span>Tare: </span><span>{data.taretype}</span></p>
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
                            <legend className={'k-form-legend'}>Edit {props.type} data</legend>
                            <div className="mb-3">
                                <Field name={'name'} component={Input} label={'Name'} />
                            </div>
                            <div className="mb-3">
                                <Field name={'description'} component={Input} label={'Description'} />
                            </div>
                            {/*<div className="mb-3">*/}
                            {/*    <Field name={'commonUid'} component={Input} label={'Common UID'} />*/}
                            {/*</div>*/}
                            <div className="mb-3" style={{ width: '400px' }}>
                                <Field name={'category'} label={'Category'}
                                       component={(compProps) =>
                                           <DropDownComp {...compProps}
                                                         loading={!categories}
                                                         data={[{name: ''}, ...categories?.map(c => ({ name: c }))]}
                                                         textField='name'
                                                         dataItemKey='name'
                                           />
                                       }
                                />
                            </div>
                            {/*<div className="mb-3" style={{ width: '400px' }}>*/}
                            {/*    <Field name={'taretype'} label={'Tare'}*/}
                            {/*           component={(compProps) =>*/}
                            {/*               <DropDownComp {...compProps}*/}
                            {/*                             loading={!taretypes}*/}
                            {/*                             data={[{name: ''}, ...taretypes?.map(t => ({ name: t }))]}*/}
                            {/*                             textField='name'*/}
                            {/*                             dataItemKey='name'*/}
                            {/*               />*/}
                            {/*           }*/}
                            {/*    />*/}
                            {/*</div>*/}
                        </fieldset>
                    }
                />
            }
        />
    );
}

