import {Field} from '@progress/kendo-react-form'
import {Checkbox, Input, NumericTextBox, RadioButton} from '@progress/kendo-react-inputs'
import {type EffectCallback, useEffect, useState} from 'react'
import {useNavigate, useParams} from 'react-router-dom'
import type {DetailEventHandler, TareType, UUID} from '../../../data/types'
import Api from '@features/api/api'
import {useGet} from '@logistics/hooks/hooks'
import {useBasePath} from '@logistics/hooks/routerHooks'
import {Detail, type DetailProps, Editor, EMPTY_GUID, Info, MasterDetail, reloadMaster} from '../../MasterDetail'
import {CardChecklist} from 'react-bootstrap-icons'

function formatSize(data: TareType) {
    const parts = [data.sizeX, data.sizeY, data.sizeZ].filter(v => v != null && v > 0)
    return parts.length > 0 ? parts.join(' \u00d7 ') : '\u2014'
}

type CountableLayoutMode = 'bulk' | 'slots'

function CountableFields({formRenderProps}: {formRenderProps: any}) {
    const units = formRenderProps.valueGetter('units') ?? ''
    const x = formRenderProps.valueGetter('sizeX') ?? 0
    const y = formRenderProps.valueGetter('sizeY') ?? 0
    const z = formRenderProps.valueGetter('sizeZ') ?? 0

    const inferredMode: CountableLayoutMode = x > 0 ? 'slots' : 'bulk'
    const [mode, setMode] = useState<CountableLayoutMode>(inferredMode)

    useEffect(() => {
        setMode(x > 0 ? 'slots' : 'bulk')
    }, [x])

    const clearDependents = (from: 'x' | 'y') => {
        if (from === 'x') {
            formRenderProps.onChange('sizeY', {value: null})
            formRenderProps.onChange('sizeZ', {value: null})
        } else {
            formRenderProps.onChange('sizeZ', {value: null})
        }
    }

    const computedCapacity = Math.max(1, (x || 1) * (y || 1) * (z || 1))

    const switchToBulk = () => {
        setMode('bulk')
        formRenderProps.onChange('sizeX', {value: null})
        formRenderProps.onChange('sizeY', {value: null})
        formRenderProps.onChange('sizeZ', {value: null})
        const current = formRenderProps.valueGetter('capacity') ?? 1
        formRenderProps.onChange('capacity', {value: Math.round(current) || 1})
    }

    const switchToSlots = () => {
        setMode('slots')
        if (!(formRenderProps.valueGetter('sizeX') > 0)) {
            formRenderProps.onChange('sizeX', {value: 1})
        }
    }

    return (
        <>
            <div className="mb-3">
                <label className="k-label">Layout</label>
                <div>
                    <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
                        <RadioButton
                            name="countableLayout"
                            label="Bulk"
                            value="bulk"
                            checked={mode === 'bulk'}
                            onChange={() => switchToBulk()}
                        />
                        <RadioButton
                            name="countableLayout"
                            label="Slots (X×Y×Z)"
                            value="slots"
                            checked={mode === 'slots'}
                            onChange={() => switchToSlots()}
                        />
                    </div>
                </div>
                <small style={{color: '#666', display: 'block', marginTop: '0.25rem'}}>
                    Bulk uses integer piece-count capacity. Slots uses addressed capacity = X×Y×Z.
                </small>
            </div>

            {mode === 'slots' && (
                <div className="mb-3">
                    <label className="k-label">Size</label>
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.35rem'}}>
                        <NumericTextBox
                            value={x || null}
                            min={1}
                            format="n0"
                            width={90}
                            placeholder="X"
                            onChange={e => {
                                const v = e.value ?? 0
                                formRenderProps.onChange('sizeX', {value: v > 0 ? v : null})
                                if (v <= 0) clearDependents('x')
                            }}
                        />
                        <span style={{color: '#888'}}>&times;</span>
                        <NumericTextBox
                            value={y || null}
                            min={1}
                            format="n0"
                            width={90}
                            placeholder="Y"
                            disabled={x <= 0}
                            onChange={e => {
                                const v = e.value ?? 0
                                formRenderProps.onChange('sizeY', {value: v > 0 ? v : null})
                                if (v <= 0) clearDependents('y')
                            }}
                        />
                        <span style={{color: '#888'}}>&times;</span>
                        <NumericTextBox
                            value={z || null}
                            min={1}
                            format="n0"
                            width={90}
                            placeholder="Z"
                            disabled={y <= 0}
                            onChange={e => {
                                const v = e.value ?? 0
                                formRenderProps.onChange('sizeZ', {value: v > 0 ? v : null})
                            }}
                        />
                    </div>
                    {x > 0 && (
                        <small style={{color: '#666', marginTop: '0.25rem', display: 'block'}}>
                            Capacity (auto): {computedCapacity} slots
                        </small>
                    )}
                </div>
            )}

            {mode === 'bulk' && (
                <div className="mb-3">
                    <label className="k-label">
                        Capacity{units ? ` (${units})` : ''}
                    </label>
                    <NumericTextBox
                        value={formRenderProps.valueGetter('capacity') || null}
                        min={1}
                        step={1}
                        format="n0"
                        onChange={e => formRenderProps.onChange('capacity', {value: Math.round(e.value ?? 1)})}
                    />
                </div>
            )}
        </>
    )
}

function NonCountableFields({formRenderProps}: {formRenderProps: any}) {
    const units = formRenderProps.valueGetter('units') ?? ''
    return (
        <div className="mb-3">
            <label className="k-label">
                Capacity{units ? ` (${units})` : ''}
            </label>
            <NumericTextBox
                value={formRenderProps.valueGetter('capacity') || null}
                min={0.001}
                format="n3"
                onChange={e => formRenderProps.onChange('capacity', {value: e.value ?? 1})}
            />
        </div>
    )
}

export function TareTypes() {
    const type = 'taretype'
    const {path} = useBasePath()
    const navigate = useNavigate()
    const api = Api.taretypes
    return (
        <MasterDetail
            type={type}
            api={api}
            path={path || ''}
            stubMessage="Please select a tare type"
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
    )
}

export interface TareTypeDetailProps extends DetailProps {
    onChange?: DetailEventHandler
    onUpdate?: DetailEventHandler
    onClose: () => void
    path: string
    api: string
    id?: UUID
    type: string
}

export function TareTypeDetail({id, ...props}: TareTypeDetailProps) {
    const params = useParams<{id: string}>()
    const effectiveId = id || params.id
    const [sub, setSub] = useState<React.ReactElement>()
    useEffect(setSub as EffectCallback, [effectiveId])
    let [[data, setData], loading, error] = useGet<TareType>(`${props.api}/${effectiveId}`, [effectiveId])
    if (!data || data.id === EMPTY_GUID) {
        data = {...data, name: '', description: ''} as TareType
    }

    return (
        <Detail
            api={props.api}
            path={props.path}
            onChange={props.onChange}
            onClose={props.onClose}
            id={effectiveId}
            icon={<CardChecklist title="TareType" />}
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
                                <p><span>Measured in: </span><strong>{data.units}</strong></p>
                                {data.countable && (
                                    <p><span>Size: </span><strong>{formatSize(data)}</strong></p>
                                )}
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
                    content={(formRenderProps: any) => (
                        <fieldset className={'k-form-fieldset'}>
                            <legend className={'k-form-legend'}>Edit {props.type} data</legend>
                            <div className="mb-3">
                                <Field name={'name'} component={Input} label={'Name'} />
                            </div>
                            <div className="mb-3">
                                <Field name={'description'} component={Input} label={'Description'} />
                            </div>
                            <div className="mb-3">
                                <Field name={'units'} component={Input} label={'Units'} />
                            </div>
                            <div className="mb-3">
                                <Field name={'countable'} component={Checkbox} label={'Countable'} />
                            </div>
                            {(formRenderProps.valueGetter('countable') ?? false)
                                ? <CountableFields formRenderProps={formRenderProps} />
                                : <NonCountableFields formRenderProps={formRenderProps} />
                            }
                        </fieldset>
                    )}
                />
            }
        />
    )
}
