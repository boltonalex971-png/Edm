import { Field } from '@progress/kendo-react-form'
import { Input } from '@progress/kendo-react-inputs'
import {type EffectCallback, useEffect, useState} from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type {DetailEventHandler, Operation, Process, ProcessKind} from "../../../data/types"
import Api from '@features/api/api'
import {useGet} from "@logistics/hooks/hooks";
import { useBasePath } from "@logistics/hooks/routerHooks"
import { DropDownComp } from '../../DropDownCell'
import {Detail, type DetailProps, Editor, EMPTY_GUID, Info, MasterDetail, reloadMaster} from '../../MasterDetail'
import { ProcessTabs } from './ProcessTabs'
import {Diagram3} from "react-bootstrap-icons";

export function Processes() {
    const type = 'process';
    const { path } = useBasePath();
    const navigate = useNavigate();
    const api = Api.processes;
    return (
        <MasterDetail
            type={type}
            api={api}
            path={path || ''}
            stubMessage='Please select a process'
            detail={
                <ProcessDetail
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

export interface ProcessDetailProps extends DetailProps {
    onChange?: DetailEventHandler,
    onUpdate?: DetailEventHandler
    onClose: () => void,
    path: string,
    api: string,
    processId?: number,
    type: string,
}

export function ProcessDetail({ processId, ...props } :ProcessDetailProps) {
    const params = useParams<{id: string}>();
    const id = processId?.toString() || params.id;
    const [sub, setSub] = useState<React.ReactElement>();
    useEffect(setSub as EffectCallback, [id]);
    const [[kinds]] = useGet<string[]>(`${Api.processes}/kinds`, []);
    let [[data, setData], loading, error] = useGet<Process>(`${props.api}/${id}`, [id]);
    if (!data || data.id === EMPTY_GUID) {
        data = { ...data, name: '', description: '' } as Process
    }

    const missedInputs = JSON.parse(data.message || '[]');
    return (
        <Detail 
            api={props.api}
            path={props.path}
            onChange={props.onChange}
            onClose={props.onClose}
            id={id}
            icon={<Diagram3 title='Process' />}
            loading={loading}
            error={error as string}
            validation={
                missedInputs.length > 0 ?
                    `Parameter${missedInputs.length > 1 ? 's' : ''} ${missedInputs.join(', ')} ${missedInputs.length > 1 ? 'are' : 'is'} not available as output parameters` : ''
            }
            data={data}
            subDetail={sub}
            card={
                <Info 
                    content={data &&
                        <>
                            <div>
                                <p>{data.kind} process</p>
                            </div>
                            {/* {data.qualifiers &&
                                <div className='my-2'>
                                    <span className='me-2'>Qualifiers:</span>
                                    <ChipList data={data.qualifiers.map((el => ({ text: el.name, value: el.id })))}
                                        chip={(chipProps) =>
                                            <Chip {...chipProps} rounded={'small'} />
                                        }
                                    />
                                </div>
                            } */}
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
                            <legend className={'k-form-legend'}>Edit process data</legend>
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
                                <Field name={'kind'} label={'Process kind'}
                                    component={(compProps) =>
                                        <DropDownComp {...compProps}
                                            loading={!kinds}
                                            data={[{name: ''}, ...kinds?.map(k => ({ name: k }))]}
                                            textField='name'
                                            dataItemKey='name'
                                        />
                                    }
                                />
                            </div>
                            {/* <div className="mb-3">
                                <Field name={'qualifiers'}
                                    component={(fieldProps) =>
                                        <MultiSelect {...fieldProps}
                                            allowCustom={true}
                                            text={fieldProps.name}
                                            value={fieldProps.}
                                            onChange={(e) => fieldProps.onChange({
                                                dataItem: fieldProps.dataItem,
                                                field: fieldProps.field,
                                                syntheticEvent: e.syntheticEvent,
                                                value: JSON.stringify(e.value)
                                            })}
                                        />
                                    }
                                    label={'Output Parameters'} />
                            </div> */}
                        </fieldset>
                    }
                />
            }
            relations={
                <ProcessTabs id={id} api={props.api} missedInputs={missedInputs} onDetailSelected={setSub} />
            }
        />
    );
}

