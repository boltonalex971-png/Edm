/* eslint-disable no-mixed-operators */
import React, { useState, useContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Container, Row, Col, Alert } from 'reactstrap';
import api from '../api';
import { useGet } from '../hooks/hooks';
import { DropDownList, DropDownTree } from '@progress/kendo-react-dropdowns';
import { Button } from '@progress/kendo-react-buttons';
import { SmartScroll, SmartScrollContent } from '../SmartScroll';
import { Loading } from '../utils/Utils';
import { Field, FormElement, Form } from '@progress/kendo-react-form';
import { Input } from '@progress/kendo-react-inputs';
import { PluginContainer } from '@microprojects/react-utils';
import { ApiContext } from '../../ApiContext';
import { useDispatch, useSelector } from 'react-redux';
import { clearDevices, clearProcess, reset, setDevice, setDriverOptions, setParameters, setProcess, setProfiles, setWorkbench } from '../../slices/newOperationSlice';
import axios from 'axios';

export function NewOperationWizard() {
    const params = useSelector(s => s.newOperation)
    const dispatch = useDispatch()
    const [error, setError] = useState();
    const [started] = useState(false);
    const [[processList]] = useGet(`${api.workplaces}/processes/allowed`);
    const [detail, setDetail] = useState(ProcessDetailStub)
    const step2Disabled = !params.process && true;
    const step3Disabled = !(params.devices && params.options && params.profiles?.every(p => params.devices[p] && params.options[p]))
    const step4Disabled = !params.parameters || step3Disabled;
    const onProcessChange = (e) => {
        dispatch(reset())
        if (e.value.isNode) {
            setDetail(ProcessDetailStub)
            return false
        } else {
            setDetail(<ProcessDetail id={e.value.id} />)
        }
    }
    const onOperationStart = () => {
        const data = {
            id: 0,
            workplaceProcessId: params.process.id,
            parameters: params.parameters && JSON.stringify(params.parameters),
            devices: Object.entries(params.devices).map((d) => {
                const id = parseInt(d)
                return {
                    profileId: id,
                    hostDeviceId: params.devices[id].hostDeviceId,
                    options: JSON.stringify(params.options[id]?.options || {})
                }
            }),
        };
        axios.post(api.operations, data)
            .then((op) => {
                window.open(`${api.baseUrl}/operations/${op.data.id}`, '_blank')
            })
            .catch((error) => setError(error));
    };

    return (
        <Container>
            <style>
                {`
                    .disabled {
                        pointer-events: none;
                        opacity: 0.4;
                    }
                `}
            </style>
            <h3>Configure new operation</h3>
            <hr />
            <SmartScroll offtop={10}>
                <Col>
                    <SmartScrollContent>
                        <Step
                            step={1}
                        >
                            <span>Select appropriate process to run</span>
                            <div className='d-inline-flex' style={{ marginTop: 10 }}>
                                <DropDownTree
                                    value={{ id: params.process?.id, name: params.process?.processName }}
                                    data={processList || []}
                                    dataItemKey='id'
                                    textField='name'
                                    loading={!processList}
                                    onChange={onProcessChange}
                                    style={{ minWidth: '300px' }}
                                />
                                {params.process &&
                                    <Button
                                        onClick={() => setDetail(<ProcessDetail id={params.process.id} />)}
                                        icon='info'
                                        className='text-info'
                                        fillMode='flat'
                                        style={{ outline: 'none', marginLeft: 5 }}>
                                    </Button>
                                }
                            </div>
                        </Step>
                        <Step
                            step={2}
                            disabled={step2Disabled}
                            description='Select devices for chosen process'
                        >
                            {!step2Disabled &&
                                <DevicesStep
                                    changeDetail={setDetail}
                                    workplaceId={params.process.workplaceId}
                                    process={params.process}
                                />
                            }
                        </Step>
                        <Step
                            step={3}
                            disabled={step3Disabled}
                            description='Specify required input parameters'
                        >
                            {!step3Disabled &&
                                <InputsStep
                                    id={params.process.processId}
                                    changeDetail={setDetail}
                                />
                            }
                        </Step>
                        <Step
                            step={4}
                            disabled={step4Disabled}
                            description='Start operation'
                        >
                            {started && <span>Operation has been started successfully!</span>}
                            {!started &&
                                <>
                                    <p>Finally, you can create the operation</p>
                                    {error &&
                                        <Alert color='danger' style={{ display: 'flex', justifyContent: 'space-around' }}>{error}</Alert>
                                    }
                                    <Button
                                        themeColor={'primary'}
                                        onClick={onOperationStart}
                                        style={{ width: '300px' }}>
                                        Create operation now
                                    </Button>
                                </>
                            }
                        </Step>
                    </SmartScrollContent>
                </Col>
                <Col>
                    <SmartScrollContent>
                        {detail}
                    </SmartScrollContent>
                </Col>
            </SmartScroll>
        </Container >
    );
}

const ProcessDetailStub = () => {
    return (
        <div style={{ display: 'flex', width: '100%' }}>
            Select process to start
        </div>
    )
}

const ProcessDetail = ({ id }) => {
    const process = useSelector(state => state.newOperation.process)
    const dispatch = useDispatch()
    useGet(`${api.workplaces}/processes/${id}`, [], data => {
        dispatch(setProcess(data))
    })
    if (!process) return <ProcessDetailStub />
    return (
        <div>
            <h6>Selected process info</h6>
            <hr />
            <p>Name: {process.processName} </p>
            <p>Description: {process.processDescription} </p>
        </div>
    )
}

Step.propTypes = {
    step: PropTypes.number,
    children: PropTypes.any,
    disabled: PropTypes.bool,
    description: PropTypes.string
}

function Step({ step, children, disabled, description }) {
    const enabled = !disabled;
    return (
        <Row style={{ paddingTop: '20px', minHeight: '50px' }} className={`${disabled && 'disabled'}`}>
            <div className='col-1' style={{ display: 'flex', justifyContent: 'center' }}>
                <span className='text-secondary' style={{ fontSize: 'x-large' }}>
                    {step}
                </span>
            </div>
            <div className='col-10' style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                {disabled && <span>{description || 'Select the options above'}</span>}
                {enabled && children}
            </div>
        </Row>
    );
}

DevicesStep.propTypes = {
    changeDetail: PropTypes.func
}

function DevicesStep({ changeDetail }) {
    const process = useSelector(state => state.newOperation.process)
    const workbench = useSelector(state => state.newOperation.workbench)
    //const devices = useSelector(state => state.newOperation.devices)
    const dispatch = useDispatch()
    const [[workbenches]] = useGet(`${api.workplaces}/processes/${process.id}/workbenches`)
    const [[profiles]] = useGet(`${api.processes}/${process.processId}/profiles`, [], data => {
        dispatch(setProfiles(data.map(p => p.id)))
    })
    const workbenchChosen = (w) => {
        axios.get(`${api.workplaces}/processes/workbenches/${w.id}/devices`).then(response => {
            dispatch(clearDevices())
            dispatch(setWorkbench(w))
            response.data.map(d => {
                dispatch(setDevice({
                    profileId: d.profileId,
                    id: d.workplaceHostDeviceId,
                    hostDeviceId: d.hostDeviceId,
                    device: d.deviceName
                }))
                dispatch(setDriverOptions({ 
                    id: d.id, 
                    profileId: d.profileId,
                    options: JSON.parse(d.configuration || '{}'),
                    output: JSON.parse(d.profileOutput || '[]') 
                }))
            })
        })
    }
    useEffect(() => workbench && workbenchChosen(workbench), [])

    if (!profiles || !workbenches)
        return (<>Loading ...</>)
    return (
        <>
            <span style={{ marginBottom: 10 }}>
                {profiles.length > 0 ?
                    `Please choose the workbench or appropriate device${profiles.length > 1 && 's'} and set options` :
                    `${process.processName} does not require any device`
                }
            </span>
            <div>
                {workbenches?.length &&
                    <DropDownList
                        data={workbenches}
                        value={workbench}
                        dataItemKey='id'
                        textField='name'
                        label='Workbench'
                        style={{ minWidth: '300px' }}
                        onChange={(e) => workbenchChosen(e.value)}
                    />
                }
                {profiles.map((el) =>
                    <DeviceDropDown
                        key={el.id}
                        api={`${api.workplaces}/${process.workplaceId}/devices/${el.profilerGuid}`}
                        type={el.profilerName}
                        profileId={el.id}
                        onChange={(event) => {
                            changeDetail(
                                <DeviceDetail
                                    id={event.value.id}
                                    profile={el}
                                />
                            )
                        }}
                    />
                )}
            </div>
        </>
    );
}

InputsStep.propTypes = {
    id: PropTypes.number,
    changeDetail: PropTypes.func
}

function InputsStep({ id, changeDetail }) {
    const [[inputs]] = useGet(`${api.processes}/${id}/inputs`)
    const dispatch = useDispatch()
    useEffect(() => {
        if (inputs) {
            if (inputs.length) {
                changeDetail(<InputsDetail inputs={inputs} />)
            } else {
                dispatch(setParameters({}))
            }
        }
    }, [inputs])

    if (!inputs) {
        return (<span>Check missing inputs...</span>)
    } else if (!inputs.length) {
        return (<span>No missing parameters in this process</span>)
    }

    return (
        <div>
            <span>
                Now specify {inputs.length} input parameter{inputs.length > 1 && 's'} for the process
            </span>
            <Button
                onClick={(e) => changeDetail(
                    <InputsDetail
                        inputs={inputs}
                    />
                )}
                icon='edit'
                className='text-info'
                fillMode='flat'
                style={{ outline: 'none', marginLeft: 5 }}>
            </Button>
        </div>
    );
}

DeviceDropDown.propTypes = {
    api: PropTypes.string,
    type: PropTypes.string,
    profileId: PropTypes.number,
    onChange: PropTypes.func
}

function DeviceDropDown({ api, type, profileId, onChange }) {
    const device = useSelector(state => state.newOperation.devices[profileId])
    const [[data]] = useGet(api);
    const onDeviceChanged = (event) => {
        onChange(event);
    };
    return (
        <div style={{ marginTop: 10, marginRight: 10, display: 'flex', flexDirection: 'column' }}>
            <div className='d-inline-flex' style={{ alignItems: 'baseline' }}>
                <DropDownList
                    value={{ id: device?.id, device: device?.device }}
                    label={type}
                    data={data || []}
                    loading={!data}
                    dataItemKey='id'
                    textField='device'
                    onChange={onDeviceChanged}
                    style={{ minWidth: '300px' }}
                />
                {device && <Button
                    onClick={(e) => onChange({ ...e, value: device })}
                    icon='edit'
                    className='text-info'
                    fillMode='flat'
                    style={{ marginLeft: 5 }}>
                </Button>}
            </div>
        </div>
    );
}

DeviceDetail.propTypes = {
    id: PropTypes.number,
    profile: PropTypes.object
};

function DeviceDetail({ id, profile }) {
    const device = useSelector(state => state.newOperation.devices[profile.id])
    const options = useSelector(state => state.newOperation.options[profile.id])
    const dispatch = useDispatch()
    const apiContext = useContext(ApiContext)
    useGet(`${api.workplaces}/devices/${id}`, [],
        data => {
            dispatch(setDevice({ profileId: profile.id, ...data }))
            if (!options && data.configuration) {
                dispatch(setDriverOptions({ 
                    id, 
                    profileId: profile.id, 
                    options: JSON.parse(data.configuration),
                    output: JSON.parse(data.profileOutput || '[]')
                }))
            }
        })
    const loaded = device && true
    return (
        <>
            {!loaded && <Loading />}
            {loaded &&
                <div>
                    <h6>Selected device info</h6>
                    <hr />
                    <p>Device: {device.device}</p>
                    <p>Model: {device.driverName}</p>
                    <p>Type: {device.profilerName}</p>
                    <p>Located on: {device.host} </p>
                    <div>
                        <PluginContainer title='Device Configuration'
                            data={options}
                            width='100%'
                            src={`${apiContext}/${device.driverHomepage}/options`}
                            onDataReceived={o => dispatch(setDriverOptions(o))}
                        />
                    </div>
                </div>
            }
        </>
    );
}

function InputsDetail({ inputs }) {
    const parameters = useSelector(state => state.newOperation.parameters)
    const dispatch = useDispatch()
    const handleSubmit = (p) => {
        dispatch(setParameters(p))
    };
    if (!inputs) return <Loading />
    return (
        <div>
            <h6>Process missing input parameters</h6>
            <hr />

            <Form
                // key={data.id}
                initialValues={parameters}
                onSubmit={handleSubmit}
                render={(formProps) => (
                    <FormElement>
                        <fieldset className={"k-form-fieldset"}>
                            <legend className={"k-form-legend"}>Enter input values</legend>
                            {inputs.map((i) =>
                                <div key={i} className="mb-1" style={{ width: 200 }}>
                                    <Field name={i} component={Input} label={i} />
                                </div>
                            )}
                        </fieldset>
                        <div className="k-form-buttons" style={{ position: 'sticky', bottom: 10, display: 'flex', justifyContent: 'flex-start', backgroundColor: 'white' }}>
                            <Button
                                disabled={!formProps.allowSubmit}
                                title='Save'
                                name='save'
                                themeColor={formProps.allowSubmit ? 'primary' : 'base'}
                                icon='save'
                                type={'submit'}
                            >
                                Accept
                            </Button>
                        </div>
                    </FormElement>
                )}
            />
        </div>
    );
}

