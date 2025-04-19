import { Field } from '@progress/kendo-react-form'
import {Checkbox, Input, NumericTextBox} from '@progress/kendo-react-inputs'
import {type EffectCallback, useEffect, useState} from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type {DetailEventHandler, TareType, UUID } from "../../../data/types"
import Api from '@features/api/api'
import {useGet} from "@logistics/hooks/hooks";
import { useBasePath } from "@logistics/hooks/routerHooks"
import { DropDownComp } from '../../DropDownCell'
import {Detail, type DetailProps, Editor, EMPTY_GUID, Info, MasterDetail, reloadMaster} from '../../MasterDetail'
import {CardChecklist, Diagram3} from "react-bootstrap-icons";

export function TareTypes() {
    const type = 'taretype';
    const { path } = useBasePath();
    const navigate = useNavigate();
    const api = Api.taretypes;
    return (
        <MasterDetail
            type={type}
            api={api}
            path={path || ''}
            stubMessage='Please select a tare type'
            detail={
                <TareTypeDetail
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

export interface TareTypeDetailProps extends DetailProps {
    onChange?: DetailEventHandler,
    onUpdate?: DetailEventHandler
    onClose: () => void,
    path: string,
    api: string,
    id?: UUID,
    type: string,
}

export function TareTypeDetail({ id, ...props } : TareTypeDetailProps) {
    const params = useParams<{id: string}>();
    const effectiveId = id || params.id;
    const [sub, setSub] = useState<React.ReactElement>();
    useEffect(setSub as EffectCallback, [effectiveId]);
    let [[data, setData], loading, error] = useGet<TareType>(`${props.api}/${effectiveId}`, [effectiveId]);
    if (!data || data.id === EMPTY_GUID) {
        data = { ...data, name: '', description: '' } as TareType
    }

    return (
        <Detail 
            api={props.api}
            path={props.path}
            onChange={props.onChange}
            onClose={props.onClose}
            id={effectiveId}
            icon={<CardChecklist title='TareType' />}
            loading={loading}
            error={error as string}
            data={data}
            subDetail={sub}
            card={
                <Info 
                    content={data &&
                        <>
                            <div>
                                <p><span>{data.countable && 'Countable'}</span></p>
                                <p><span>Measured in: </span><strong>{data.unit}</strong></p>
                                <p><span>Dimensions: </span><strong>{data.dimensions}</strong></p>
                                <p><span>Capacity: </span><strong>{data.capacity}</strong></p>
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
                            <div className="mb-3">
                                <Field name={'unit'} component={Input} label={'Units'} />
                            </div>
                            <div className="mb-3">
                                <Field name={'countable'} component={Checkbox} label={'Countable'} />
                            </div>
                            <div className="mb-3">
                                <Field name={'dimensions'} component={NumericTextBox} label={'Dimensions'} />
                            </div>
                            <div className="mb-3">
                                <Field name={'capacity'} component={NumericTextBox} label={'Capacity'} />
                            </div>
                        </fieldset>
                    }
                />
            }
        />
    );
}

