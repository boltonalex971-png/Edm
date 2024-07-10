/* eslint-disable no-mixed-operators */
import React, { useState, useEffect, useCallback, useContext } from 'react';
import PropTypes from 'prop-types';
import { Input as BSInput, Container, Row, Col, Alert } from 'reactstrap';
import api from '../api';
import { useGet } from '../hooks/hooks';
import { DropDownList, DropDownTree } from '@progress/kendo-react-dropdowns';
import { Button } from '@progress/kendo-react-buttons';
import { Route, useHistory, useParams, Switch } from 'react-router-dom';
import { SmartScroll, SmartScrollContent } from '../SmartScroll';
import Axios from 'axios';
import { Loading } from '../utils/Utils';
import { Field, FormElement, Form } from '@progress/kendo-react-form';
import { Input } from '@progress/kendo-react-inputs';
import { PluginContainer } from '@microprojects/react-utils';
import { ApiContext } from '../../ApiContext';

export function NewOperationWizard() {
    const [error, setError] = useState();
    const [started] = useState(false);
    const [[processList]] = useGet(`${api.workplaces}/processes/allowed`);
    const [step, setStep] = useState()
    const [process, setProcess] = useState();
    const [processData, setProcessData] = useState() //useGet(`${api.processes}/${processId}`, [processId]);
    const [devices, setDevices] = useState(false);
    const [deviceOptions, setDeviceOptions] = useState([]);
    const [detail, setDetail] = useState(ProcessDetailStub)
    const [inputs, setInputs] = useState();
    const step2Disabled = !process && true;
    const step3Disabled = !devices;
    const step4Disabled = !inputs && true;
    const onProcessChange = (e) => {
        if (e.value.isNode) {
            setProcess(null);
            setProcessData(null)
            setStep(null)
            return false
        } else {
            Axios.get(`${api.workplaces}/processes/${e.value.id}`)
                .then((p) => {
                    setProcess(e.value);
                    setProcessData(p.data.process)
                    setDetail(<ProcessDetail process={p.data.process} />)
                })
                .catch((error) => setError(error));
        }

        setDevices(false);
        setInputs(null);
    };
    const onOperationStart = () => {
        const data = {
            id: 0,
            workplaceProcessId: process.id,
            devices: deviceOptions.map((p) => ({
                profileId: p.profileId,
                hostDeviceId: p.hostDeviceId,
                options: JSON.stringify(p.options)
            })),
        };
        Axios.post(api.operations, data)
            .then((op) => {
                //setStarted(true);
                window.open(`${api.baseUrl}/operations/${op.data.id}`, '_blank')
            })
            .catch((error) => setError(error));
    };
    const onDeviceOptionsChanged = (options) => {
        setDeviceOptions(o => [...o.filter((d) => d.id !== options.id), options]);
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
                                    data={processList || []}
                                    dataItemKey='id'
                                    textField='name'
                                    loading={!processList}
                                    onChange={onProcessChange}
                                    style={{ minWidth: '300px' }}
                                />
                                {process &&
                                    <Button
                                        onClick={() => setDetail(<ProcessDetail process={processData} />)}
                                        icon='info'
                                        className='text-info'
                                        fillMode='clear'
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
                            {processData &&
                                <DevicesStep
                                    changeDetail={setDetail}
                                    workplaceId={process.parentId}
                                    process={processData}
                                    onAllSelected={setDevices}
                                    onDeviceOptionsChanged={onDeviceOptionsChanged}
                                />
                            }
                        </Step>
                        <Step
                            step={3}
                            disabled={step3Disabled}
                            description='Specify required input parameters'
                        >
                            <InputsStep
                                id={processData?.id}
                                changeDetail={setDetail}
                                onComplete={setInputs}
                            />
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

const ProcessDetail = ({ process }) => {
    return (
        <div>
            <h6>Selected process info</h6>
            <hr />
            <p>Name: {process.name} </p>
            <p>Description: {process.description} </p>
            <p>Devices: {process.deviceTypes} </p>
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
    workplaceId: PropTypes.number,
    process: PropTypes.any,
    onAllSelected: PropTypes.func,
    changeDetail: PropTypes.func,
    onDeviceOptionsChanged: PropTypes.func
}

function DevicesStep({ workplaceId, process, onAllSelected, changeDetail, onDeviceOptionsChanged }) {
    const [[profiles]] = useGet(`${api.processes}/${process.id}/profiles`, [], () => {
        setDevices([])
    });
    const [devices, setDevices] = useState([]);
    useEffect(() => {
        if (devices.length !== 0 && devices.length === profiles.length) {
            onAllSelected(true);
        }
    }, [devices]);
    useEffect(() => {
        if (profiles && profiles.length === 0) {
            onAllSelected(true)
        }
    }, [profiles])

    if (!profiles) return (<>Loading ...</>)

    return (
        <>
            <div>
                <span>
                    {process.name}
                    {profiles.length > 0 &&
                        <>
                            &nbsp;requires {profiles.map(p => p.profilerName).join(', ')}.<br />
                            Please choose appropriate device{profiles.length > 1 && 's'} and set options
                        </>
                    }
                    {profiles.length === 0 && ` does not require any device`}
                </span>
            </div>
            <div>
                {profiles.map((el) =>
                    <DeviceDropDown
                        api={`${api.workplaces}/${workplaceId}/devices/${el.profilerGuid}`}
                        key={el.id}
                        type={el.profilerName}
                        details={'/options'}
                        onChange={(event) => {
                            changeDetail(
                                <DeviceDetail
                                    id={event.value.id}
                                    profile={el}
                                    onOptionsChanged={(options) => onDeviceOptionsChanged({ ...event.value, profileId: el.id, options })}
                                />
                            )
                            setDevices([...devices.filter((d) => d.id !== event.value.id), event.value]);
                        }}
                    />
                )}
            </div>
        </>
    );
}

InputsStep.propTypes = {
    id: PropTypes.number,
    onComplete: PropTypes.func,
    changeDetail: PropTypes.func
}

function InputsStep({ id, onComplete, changeDetail }) {
    const [[inputs]] = useGet(`${api.processes}/${id}/inputs`)
    useEffect(() => {
        if (inputs && !inputs.length) {
            onComplete([])
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
                        onCompete={onComplete}
                    />
                )}
                icon='edit'
                className='text-info'
                fillMode='clear'
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
    const [[data]] = useGet(api);
    const [device, setDevice] = useState();
    const onDeviceChanged = (event) => {
        setDevice({ ...event.value, profileId });
        onChange(event);
    };
    return (
        <div style={{ marginRight: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{ marginTop: 10 }}>{type}</span>
            <div className='d-inline-flex' style={{ marginTop: 5 }}>
                <DropDownList
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
                    fillMode='clear'
                    style={{ outline: 'none', marginLeft: 5 }}>
                </Button>}
            </div>
        </div>
    );
}

DeviceDetail.propTypes = {
    id: PropTypes.number,
    profile: PropTypes.object,
    onOptionsChanged: PropTypes.func
};

function DeviceDetail({ id, profile, onOptionsChanged }) {
    const apiContext = useContext(ApiContext)
    const [[data]] = useGet(`${api.workplaces}/devices/${id}`);
    const arg = data && {
        options: JSON.parse(data.configuration || '{}'),
        output: JSON.parse(profile.output || '[]')
    };
    return (
        <>
            {!data && <Loading />}
            {data &&
                <div>
                    <h6>Selected device info</h6>
                    <hr />
                    <p>Device: {data.device}</p>
                    <p>Model: {data.driverName}</p>
                    <p>Type: {data.profilerName}</p>
                    <p>Located on: {data.host} </p>
                    <div>
                        <PluginContainer title='Device Configuration'
                            data={arg || {}}
                            width='100%'
                            src={`${apiContext}/${data.driverHomepage}/options`}
                            onDataReceived={onOptionsChanged}
                        />
                    </div>
                </div>
            }
        </>
    );
}

function InputsDetail({ inputs, onCompete }) {
    const handleSubmit = (e) => {
        onCompete(e)
    };
    return (
        <>
            {!inputs && <Loading />}
            {inputs &&
                <div>
                    <h6>Process missing input parameters</h6>
                    <hr />

                    <Form
                        // key={data.id}
                        // initialValues={{ textJson: initialValues }}
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
                                        title='Save'
                                        name='save'
                                        themeColor={'primary'}
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
            }
        </>
    );
}

