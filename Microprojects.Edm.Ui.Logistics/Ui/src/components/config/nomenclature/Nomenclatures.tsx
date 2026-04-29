import Api from '@features/api/api'
import { useEntityToken } from '@logistics/hooks/entityRefresh'
import { useGet } from '@logistics/hooks/hooks'
import { useBasePath } from '@logistics/hooks/routerHooks'
import { Field } from '@progress/kendo-react-form'
import { Checkbox, Input } from '@progress/kendo-react-inputs'
import { type EffectCallback, useEffect, useState } from 'react'
import { CardChecklist } from 'react-bootstrap-icons'
import { useNavigate, useParams } from 'react-router-dom'
import type {
    DetailEventHandler,
    Nomenclature,
    UUID,
} from '../../../data/types'
import { DropDownComp } from '../../DropDownCell'
import {
    Detail,
    type DetailProps,
    EMPTY_GUID,
    Editor,
    Info,
    MasterDetail,
} from '../../MasterDetail'
import { NomenclatureTabs } from './NomenclatureTabs'

export function Nomenclatures() {
    const type = 'nomenclature'
    const { path } = useBasePath()
    const navigate = useNavigate()
    const api = Api.nomenclatures
    return (
        <MasterDetail
            type={type}
            api={api}
            path={path || ''}
            stubMessage="Please select a nomenclature"
            detail={
                <NomenclatureDetail
                    type={type}
                    api={api}
                    path={path || ''}
                    onClose={() => navigate(path)}
                />
            }
        />
    )
}

export interface NomenclatureDetailProps extends DetailProps {
    onUpdate?: DetailEventHandler
    type: string
}

export function NomenclatureDetail({ id, ...props }: NomenclatureDetailProps) {
    const params = useParams<{ id: string }>()
    const effectiveId = (id || params.id) as UUID | undefined
    const [sub, setSub] = useState<React.ReactElement>()
    useEffect(setSub as EffectCallback, [effectiveId])
    const [[categories]] = useGet<string[]>(
        `${Api.nomenclatures}/categories`,
        [],
    )
    const entityToken = useEntityToken([
        { type: props.type, id: effectiveId },
    ])
    let [[data, setData], loading, error] = useGet<Nomenclature>(
        `${props.api}/${effectiveId}`,
        [effectiveId, entityToken],
    )
    if (!data || data.id === EMPTY_GUID) {
        data = { ...data, name: '', description: '' } as Nomenclature
    }

    return (
        <Detail
            {...props}
            id={effectiveId}
            icon={<CardChecklist title="Nomenclature" />}
            loading={loading}
            error={error as string}
            data={data}
            subDetail={sub}
            card={
                <Info
                    content={
                        data && (
                            <>
                                <div>
                                    <p>
                                        <span>Category: </span>
                                        <span>{data.category}</span>
                                    </p>
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
                                Edit {props.type} data
                            </legend>
                            <div className="mb-3">
                                <Field
                                    name={'name'}
                                    component={Input}
                                    label={'Name'}
                                />
                            </div>
                            <div className="mb-3">
                                <Field
                                    name={'description'}
                                    component={Input}
                                    label={'Description'}
                                />
                            </div>
                            <div className="mb-3" style={{ width: '400px' }}>
                                <Field
                                    name={'category'}
                                    label={'Category'}
                                    component={(compProps) => (
                                        <DropDownComp
                                            {...compProps}
                                            loading={!categories}
                                            data={[
                                                { name: '' },
                                                ...categories?.map((c) => ({
                                                    name: c,
                                                })),
                                            ]}
                                            textField="name"
                                            dataItemKey="name"
                                        />
                                    )}
                                />
                            </div>
                            <div className="mb-3">
                                <Field
                                    name={'countable'}
                                    component={Checkbox}
                                    label={'Countable'}
                                />
                            </div>
                        </fieldset>
                    }
                />
            }
            relations={
                effectiveId &&
                effectiveId !== EMPTY_GUID && (
                    <NomenclatureTabs
                        id={effectiveId}
                        api={props.api}
                        onDetailSelected={setSub}
                    />
                )
            }
        />
    )
}
