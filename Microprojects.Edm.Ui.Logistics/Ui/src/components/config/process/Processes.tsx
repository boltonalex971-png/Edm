import { Field } from '@progress/kendo-react-form'
import { Input } from '@progress/kendo-react-inputs'
import {type EffectCallback, useEffect, useState} from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type {DetailEventHandler, Item, Operation, Process, ProcessKind, UUID} from "../../../data/types"
import Api from '@features/api/api'
import {useGet} from "@logistics/hooks/hooks";
import { useBasePath } from "@logistics/hooks/routerHooks"
import { DropDownComp } from '../../DropDownCell'
import {Detail, type DetailProps, Editor, EMPTY_GUID, Info, MasterDetail, reloadMaster} from '../../MasterDetail'
import { ProcessTabs } from './ProcessTabs'
import {Diagram3} from "react-bootstrap-icons";

export function Processes({ kind }: { kind?: ProcessKind }) {
    const type = 'process';
    const { path } = useBasePath();
    const navigate = useNavigate();
    const api = Api.processes;
    return (
        <MasterDetail
            type={type}
            api={api}
            kind={kind}
            path={path || ''}
            stubMessage='Please select a process'
            detail={
                <ProcessDetail
                    type={type}
                    api={api}
                    path={path || ''}
                    kind={kind}
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
    path?: string,
    api: string,
    processId?: UUID,
    type?: string,
    kind?: ProcessKind,
}

export function ProcessDetail({ processId, kind, ...props } :ProcessDetailProps) {
    const params = useParams<{id: string}>();
    const id = processId?.toString() || params.id;
    const [sub, setSub] = useState<React.ReactElement>();
    useEffect(setSub as EffectCallback, [id]);
    const [[noms]] = useGet<Item[]>(`${Api.nomenclatures}`, []);
    let [[data, setData], loading, error] = useGet<Process>(`${props.api}/${id}`, [id]);
    if (!data || data.id === EMPTY_GUID) {
        data = { ...data, name: '', description: '' } as Process
    }

    if (kind && !data.kind) {
        data = { ...data, kind };
    }

    const missedInputs = JSON.parse(data.message || '[]');
    return (
        <Detail {...props}
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
                                <p>{data.nomenclatureName}</p>
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
                                <Field
                                    name={'kind'}
                                    component={(fieldProps) => (
                                        <>
                                            <label className="k-label mb-1">Process kind</label>
                                            <Input
                                                name={fieldProps.name}
                                                value={kind} 
                                                disabled
                                                readOnly
                                            />
                                        </>
                                    )}
                                />
                            </div>
                            <div className="mb-3" style={{ width: '400px' }}>
                                <Field name={'nomenclatureId'} label={'Nomenclature'}
                                       component={(compProps) =>
                                           <DropDownComp {...compProps}
                                                         loading={!noms}
                                                         data={noms}
                                                         textField='name'
                                                         dataItemKey='id'
                                                         valueField='nomenclatureId'
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
                <ProcessTabs id={id} api={props.api} kind={data.kind as ProcessKind} missedInputs={missedInputs} onDetailSelected={setSub} />
            }
        />
    );
}

