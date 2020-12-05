import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Input as BSInput, Container, Row, Col, Alert } from 'reactstrap';
import api from '../api';
import { useGet } from '../hooks/hooks';
import { DropDownList } from '@progress/kendo-react-dropdowns';
import { Button } from '@progress/kendo-react-buttons';
import { Route, useHistory, useParams, Switch } from 'react-router-dom';
import { SmartScroll, SmartScrollContent } from '../SmartScroll';
import Axios from 'axios';
import { Loading } from '../utils/Utils';
import { Field, FormElement, Form } from '@progress/kendo-react-form';
import { Input } from '@progress/kendo-react-inputs';

export function NewOperationWizard() {
    const history = useHistory();
    const [error, setError] = useState();
    const [started] = useState(false);
    const [[processList]] = useGet(api.processes);
    const [process, setProcess] = useState();
    const processId = process ? process.id : 0;
    const [[processData]] = useGet(`${api.processes}/${processId}`);
    const [devices, setDevices] = useState();
    const [deviceOptions, setDeviceOptions] = useState([]);
    const [profiles, setProfiles] = useState();
    const step2Disabled = !process && true;
    const step3Disabled = !devices && true;
    const step4Disabled = !profiles && true;
    const onProcessChange = (event) => {
        openProcess();
        setProcess(event.value);
        setDevices(null);
        setProfiles(null);
    };
    const openProcess = () => {
        history.push('/process');
    };
    const onOperationStart = () => {
        const data = {
            id: 0,
            processId: process.id,
            devices: profiles.map((p) => ({
                profileId: p.id,
                hostDeviceId: p.deviceId,
                options: function () {
                    // eslint-disable-next-line no-unused-vars
                    const { id, ...options } = deviceOptions.find(o => o.id === p.deviceId) || {};
                    return JSON.stringify(options);
                }()
            })),
        };
        Axios.post(api.operations, data)
            .then((op) => {
                //setStarted(true);
                window.open(`/app/test?id=${op.data.id}`, '_blank');
            })
            .catch((error) => setError(error));
    };
    const onDeviceOptionsChanged = (options) => {
        setDeviceOptions([...deviceOptions.filter((d) => d.id !== options.id), options]);
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
                            <p>Select appropriate process to run</p>
                            <div className='d-inline-flex'>
                                <DropDownList
                                    data={processList || []}
                                    dataItemKey='id'
                                    textField='name'
                                    loading={!processList}
                                    onChange={onProcessChange}
                                    style={{ minWidth: '300px' }}
                                />
                                {process && <Button onClick={openProcess} icon='info' className='text-info' look='bare' style={{ outline: 'none' }}></Button>}
                            </div>
                        </Step>
                        <Step
                            step={2}
                            disabled={step2Disabled}
                            description='Select devices for chosen process'
                        >
                            <DevicesStep
                                process={processData}
                                onAllSelected={setDevices} />
                        </Step>
                        <Step
                            step={3}
                            disabled={step3Disabled}
                            description='Configure selected devices and choose executing profiles'
                        >
                            <ProfilesStep
                                key={devices && devices.map((d) => d.id).join(',')}
                                devices={devices}
                                onAllSelected={setProfiles}
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
                                        primary
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
                        <Switch>
                            <Route path={`/process`}>
                                {process &&
                                    <div>
                                        <h6>Selected process info</h6>
                                        <hr />
                                        <p>Name: {process.name} </p>
                                        <p>Description: {process.description} </p>
                                        <p>Devices: {process.deviceTypes} </p>
                                    </div>
                                }
                            </Route>
                            <Route path={`/options/:device`}>
                                <DeviceDetails onOptionsChanged={onDeviceOptionsChanged} />
                            </Route>
                            <Route path={`/profiles/:profile`}>
                                <ProfileDetails />
                            </Route>
                        </Switch>
                    </SmartScrollContent>
                </Col>
            </SmartScroll>
        </Container>
    );
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
    process: PropTypes.any,
    onAllSelected: PropTypes.func
}

function DevicesStep({ process, onAllSelected }) {
    const deviceTypes = process && JSON.parse(process.deviceTypes);
    const [devices, setDevices] = useState([]);
    const history = useHistory();
    useEffect(() => {
        if (devices.length != 0 && devices.length == deviceTypes.length) {
            onAllSelected(devices);
        }
    });
    return (
        <>
            <div>
                <p>
                    {process.name}
                    {deviceTypes.length > 0 &&
                        <>
                            &nbsp;requires {deviceTypes.join(', ')}.<br />
                            Please choose appropriate device{deviceTypes.length > 1 && 's'} and set options
                        </>
                    }
                    {deviceTypes.length === 0 && ` does not require any devices`}
                </p>
            </div>
            <div>
                {deviceTypes.map((el) =>
                    <DeviceDropDown
                        api={`${api.workplaces}/devices?type=${el}`}
                        key={el}
                        type={el}
                        details={'/options'}
                        onChange={(event) => {
                            history.push(`/options/${event.value.id}`);
                            setDevices([...devices.filter((d) => d.id !== event.value.id), event.value]);
                        }}
                    />
                )}
            </div>
        </>
    );
}

ProfilesStep.propTypes = {
    devices: PropTypes.array,
    onAllSelected: PropTypes.func
}

function ProfilesStep({ devices, onAllSelected }) {
    const history = useHistory();
    const [profiles, setProfiles] = useState([]);
    useEffect(() => {
        if (profiles.length !== 0 && profiles.length === devices.length) {
            onAllSelected(profiles);
        }
    }, [profiles]);
    return (
        <>
            <p>Great! Now select device profiles</p>
            {devices.map((el) =>
                <DeviceDropDown
                    api={`${api.profiles}/devices/${el.id}`}
                    key={el.id}
                    type={el.name}
                    details={'/profiles'}
                    onChange={(event) => {
                        history.push(`/profiles/${event.value.id}`);
                        setProfiles([...profiles.filter((d) => d.id != event.value.id), { ...event.value, deviceId: el.id }]);
                    }}
                />
            )}
        </>
    );
}

DeviceDropDown.propTypes = {
    api: PropTypes.string,
    type: PropTypes.string,
    details: PropTypes.string,
    onChange: PropTypes.func
}

function DeviceDropDown({ api, type, details, onChange }) {
    const history = useHistory();
    const [[data]] = useGet(api, [api]);
    const [id, setId] = useState();
    const onDeviceChanged = (event) => {
        setId(event.value.id);
        onChange(event);
    };
    return (
        <div style={{ marginRight: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span>{type}</span>
            <div className='d-inline-flex'>
                <DropDownList
                    data={data || []}
                    loading={!data}
                    dataItemKey='id'
                    textField='name'
                    onChange={onDeviceChanged}
                    style={{ minWidth: '300px' }}
                />
                {id && <Button onClick={() => history.push(`${details}/${id}`)} icon='info' className='text-info' look='bare' style={{ outline: 'none' }}></Button>}
            </div>
        </div>
    );
}

function DeviceDetails({ onOptionsChanged }) {
    const { device } = useParams();
    const [[data]] = useGet(`${api.hosts}/devices/${device}`);
    return (
        <>
            {!data && <Loading />}
            {data &&
                <div>
                    <h6>Selected device info</h6>
                    <hr />
                    <p>Device: {data.deviceName}</p>
                    <p>Model: {data.deviceModel}</p>
                    <p>Type: {data.deviceEnvType}</p>
                    <p>Located on: {data.hostName} </p>
                    {data.deviceEnvType === 'Testing' &&
                        <>
                            <Form
                                initialValues={{ id: data.id, port: 'COM4', baudrate: '9600' }}
                                onSubmit={onOptionsChanged}
                                render={(formProps) => (
                                    <div>
                                        <div className='d-flex justify-content-between align-items-center' style={{ maxWidth: '400px' }}>
                                            <h6 className='mb-0'>Options</h6>
                                            <div>
                                                <Button icon='reset' disabled={!formProps.allowSubmit} onClick={formProps.onFormReset} look='bare' className='text-secondary'></Button>
                                                <Button icon='save' disabled={!formProps.allowSubmit} onClick={formProps.onSubmit} look='bare' ></Button>
                                            </div>
                                        </div>
                                        <hr className='mt-0' />
                                        <FormElement>
                                            <fieldset className={'k-form-fieldset'}>
                                                <div className="mb-2" style={{ maxWidth: '400px' }}>
                                                    <Field name={'port'} component={Input} label={'Port'} />
                                                </div>
                                                <div className="mb-2" style={{ maxWidth: '400px' }}>
                                                    <Field name={'baudrate'} component={Input} label={'Baudrate'} />
                                                </div>
                                            </fieldset>
                                        </FormElement>
                                    </div>
                                )}
                            />
                        </>
                    }
                </div>
            }
        </>
    );
}

function ProfileDetails() {
    const { profile } = useParams();
    const [[data]] = useGet(`${api.profiles}/${profile}`);
    const initialValues = data ?
        data.points ?
            data.points && data.points.map(p => `${p.order}\t${p.offset}\t${p.operation}`).join('\n')
            :
            ''
        :
        '';
    const handleSubmit = (dataItem) => {
        //console.log('e :>> ', dataItem);
    };
    return (
        <>
            {!data && <Loading />}
            {data &&
                <div>
                    <h6>Selected profile info</h6>
                    <hr />
                    <p>Name: {data.name}</p>
                    <p>Description: {data.description}</p>
                    <p>For device: {data.model}</p>
                    <Form
                        key={data.id}
                        initialValues={{ textJson: initialValues }}
                        onSubmit={handleSubmit}
                        render={(formProps) => (
                            <div>
                                <div className='d-flex justify-content-between align-items-center' style={{ maxWidth: '400px' }}>
                                    <h6 className='mb-0'> Profile</h6>
                                    <div>
                                        {/* <Button icon='reset' type={'reset'} disabled={!formProps.allowSubmit} look='bare' className='text-secondary'></Button> */}
                                        <Button icon='save' disabled={!formProps.allowSubmit} onClick={formProps.onSubmit} look='bare'></Button>
                                    </div>
                                </div>
                                <hr className='mt-0' />
                                <FormElement>
                                    <fieldset className={'k-form-fieldset'} disabled>
                                        <div className="mb-3" style={{ maxWidth: '400px' }}>
                                            <Field name={'textJson'} component={TextArea} label={'Commands'} />
                                        </div>
                                    </fieldset>
                                </FormElement>
                            </div>
                        )}
                    />
                </div>
            }
        </>
    );
}

function TextArea(fieldRenderProps) {
    const onValueChange = useCallback(
        (event) => fieldRenderProps.onChange(event.target.value),
        [fieldRenderProps.onChange]
    );
    return (
        <BSInput
            type='textarea'
            rows={12}
            value={fieldRenderProps.value}
            onChange={onValueChange}
        >
        </BSInput>
    );
}