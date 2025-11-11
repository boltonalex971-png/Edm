import React, {useMemo, useRef} from 'react';
import {
    Collapse,
    Container,
    Navbar,
    NavbarBrand,
    NavbarToggler,
    NavItem,
    Label,
    NavbarText,
    Input,
    Nav
} from 'reactstrap';
import {Link as RouterNavLink} from 'react-router-dom';
import {DateTimePicker} from '@progress/kendo-react-dateinputs';
import './OperationMenu.css';
import {Button} from '@progress/kendo-react-buttons';
import {formatDate} from '@telerik/kendo-intl';
import {useState} from 'react';
import {useEffect} from 'react';
import {useGet} from '../hooks/hooks';
import Axios from 'axios';
import {utcDateToLocal} from "../utils/Utils";
import api from "../api";

export function OperationMenu({process, to, ...props}) {
    const [collapsed, setCollapsed] = useState(true);
    const toggleNavbar = () => {
        setCollapsed(!collapsed);
    };
    return (
        <header style={{width: '100%'}}>
            <Navbar color="light" expand="md" light className="d-inline-flex justify-content-between"
                    style={{width: '100%', paddingRight: '40px'}}>
                <NavbarBrand>#{props.operationId} <strong>{process && process.name}</strong></NavbarBrand>
                <NavbarToggler onClick={toggleNavbar} className="mr-2"/>
                {/* <Collapse className="d-inline-flex justify-content-between" isOpen={!collapsed} navbar> */}
                <Nav>
                    <NavItem>
                        <RouterNavLink to='#' className='text-dark nav-link' onClick={() => to('')}>
                            <span className='k-icon k-i-home'></span>
                        </RouterNavLink>
                    </NavItem>
                    <NavItem>
                        <RouterNavLink to='#' className='text-dark nav-link' onClick={() => to('config')}>
                            <span className='k-icon k-i-gear'></span>
                        </RouterNavLink>
                    </NavItem>
                </Nav>
                <NavbarText>
                    <Timer/>
                </NavbarText>
                <OperationToolbar {...props} />
                {/* </Collapse> */}
            </Navbar>
        </header>
    );
}

let timerInterval;

function Timer() {
    const [timer, setTimer] = useState(new Date());
    useEffect(() => {
        timerInterval = setInterval(() => setTimer(new Date()), 1000);
        return () => clearInterval(timerInterval);
    }, []);
    return (
        formatDate(timer, 'dd MMMM HH:mm:ss')
    );
}

let timeout, interval;

function OperationToolbar({operationId, apiBase, onStarted, onCompleted, onCancelled}) {
    const [refresh, setRefresh] = useState(false);
    const [[status]] = useGet(`${apiBase}/${operationId}/status`, [refresh], 
        (data) => ({state: data.state, date: utcDateToLocal(data.stateTimestamp)}));
    const stopBtn = useRef(null);
    const startBtn = useRef(null);
    const copyBtn = useRef(null);
    const statusLbl = useRef(null);
    const startAtInput = useRef();

    //const state = status?.state //useMemo(() => status?.state, [status]);
    //const date = utcDateToLocal(status?.stateTimestamp) //useMemo(() => utcDateToLocal(status?.stateTimestamp), [status]);

    const copy = () => {
        copyBtn.current.element.setAttribute('disabled', 'disabled');
        statusLbl.current.textContent = 'Copying...';
        Axios.post(`${apiBase}/${operationId}`)
            .then((response) => {
                window.open(`/operations/${response.data.id}`, '_self')
            })
            .catch((error) => {
                copyBtn.current.element.removeAttribute('disabled');
                statusLbl.current.textContent = 'Failed to copy';
            });
    };
    const start = () => {
        const currentDate = new Date();
        const specifiedDate = startAtInput.current.value;
        const startAt = specifiedDate > currentDate ? specifiedDate : currentDate;
        startBtn.current.element.setAttribute('disabled', 'disabled');
        statusLbl.current.textContent = 'Starting...';
        Axios.post(`${apiBase}/${operationId}/start`, startAt)
            .then((response) => {
                setRefresh(r => !r);
            })
            .catch((error) => {
                startBtn.current.element.removeAttribute('disabled');
                statusLbl.current.textContent = 'Faulted';
                window.alert(error.response?.data?.detail);
            });
    };
    const stop = () => {
        if (window.confirm('Confirm operation cancelling')) {
            stopBtn.current.element.setAttribute('disabled', 'disabled');
            statusLbl.current.textContent = 'Cancelling...';

            Axios.post(`${apiBase}/${operationId}/stop`)
                .then((response) => {
                    setRefresh(r => !r);
                    onCancelled();
                })
                .catch((error) => alert(error));
        }
    };
    const complete = () => {
        if (window.confirm('Confirm operation completing')) {
            stopBtn.current.element.setAttribute('disabled', 'disabled');
            statusLbl.current.textContent = 'Completing...';

            Axios.post(`${apiBase}/${operationId}/complete`)
                .then((response) => {
                    setRefresh(r => !r);
                    onCompleted();
                })
                .catch((error) => alert(error));
        }
    };
    const close = () => window.close()
    useEffect(() => {
        if (!status) return 
        const finalize = () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
        finalize();
        if (status.state === 'Scheduled') {
            timeout = setTimeout(() => setRefresh(r => !r), status.date - Date.now());
        } else if (status.state === 'InProgress') {
            onStarted();
            interval = setInterval(() => setRefresh(r => !r), 2000);
        } else if (status.state === 'Completed') {
            onCompleted();
        }
        return finalize;
    }, [status?.state]);

    return (
        status &&
        <div style={{display: 'flex', flexWrap: 'nowrap', alignItems: 'baseline'}}>
            <form style={{display: 'flex', flexWrap: 'nowrap', alignItems: 'baseline'}}>
                <Label>
                    <span className='text-nowrap me-2'>
                        {status.state === 'Idle' && 'Start at '}
                        {status.state === 'Scheduled' && 'Will start at'}
                        {status.state === 'InProgress' && 'Started at '}
                        {status.state === 'Completed' && 'Completed at '}
                        {status.state === 'Cancelled' && 'Cancelled at '}
                        {status.state === 'Faulted' && 'Checked at '}
                    </span>
                </Label>
                {status.state === 'Idle' &&
                    <DateTimePicker
                        ref={startAtInput}
                        placeholder={'Now'}
                        format={'dd MMMM HH:mm'}
                    />
                }
                {!(status.state === 'Idle') &&
                    <Input value={formatDate(new Date(status.date), 'dd MMMM HH:mm:ss')} disabled></Input>
                }
                <span ref={statusLbl} className='mx-2'>
                    {status?.state}
                </span>
            </form>
            <Button icon='play' ref={startBtn}
                    hidden={!(status.state === 'Idle')}
                    className='ms-2'
                    onClick={start}>Start</Button>
            <Button icon='stop' ref={stopBtn}
                    hidden={status.state !== 'InProgress'}
                    className='ms-2'
                    onClick={stop}>Stop</Button>
            <Button icon='copy' ref={copyBtn} id={status}
                    hidden={status.state === 'InProgress'}
                    className='ms-2'
                    onClick={copy}>Copy</Button>
            <Button icon='check' ref={stopBtn}
                    hidden={!(status.state === 'Idle'|| status.state === 'Faulted')}
                    className='ms-2'
                    onClick={complete}>Complete</Button>
            <Button icon='x'
                    className='ms-2'
                    title='Close the window'
                    fillMode='flat'
                    onClick={close}></Button>
        </div>
    );
}
