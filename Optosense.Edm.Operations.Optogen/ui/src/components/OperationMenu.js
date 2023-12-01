import React, { useMemo, useRef } from 'react';
import { Collapse, Container, Navbar, NavbarBrand, NavbarToggler, NavItem, Label, NavbarText, Input, Nav } from 'reactstrap';
import { Link as RouterNavLink } from 'react-router-dom';
import { DateTimePicker } from '@progress/kendo-react-dateinputs';
import './OperationMenu.css';
import { Button } from '@progress/kendo-react-buttons';
import { formatDate } from '@telerik/kendo-intl';
import { useState } from 'react';
import { useEffect } from 'react';
import { useGet } from './hooks/hooks';
import Axios from 'axios';

export function OperationMenu({ process, ...props }) {
    const [collapsed, setCollapsed] = useState(true);
    const toggleNavbar = () => {
        setCollapsed(!collapsed);
    };
    return (
        <header>
            <Navbar color="light" expand="md" light className="d-inline-flex justify-content-between" style={{ width: '100%' }} >
                <NavbarBrand >#{props.operationId} {process && process.name}</NavbarBrand>
                <NavbarToggler onClick={toggleNavbar} className="mr-2" />
                {/* <Collapse className="d-inline-flex justify-content-between" isOpen={!collapsed} navbar> */}
                <Nav>
                    <NavItem>
                        <RouterNavLink to='' className='text-dark nav-link'><span className='k-icon k-i-home'></span></RouterNavLink>
                    </NavItem>
                    <NavItem>
                        <RouterNavLink to='config' className='text-dark nav-link'><span className='k-icon k-i-gear'></span></RouterNavLink>
                    </NavItem>
                </Nav>
                <NavbarText>
                    <Timer />
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

function OperationToolbar({ operationId, apiBase, onStarted, onCompleted, onCancelled }) {
    const [refresh, setRefresh] = useState(false);
    const [[status]] = useGet(`${apiBase}/api/operations/${operationId}/status`, [refresh]);
    const stopBtn = useRef(null);
    const startBtn = useRef(null);
    const statusLbl = useRef(null);
    const startAtInput = useRef();

    const state = useMemo(() => status?.state, [status]);
    const date = useMemo(() => status?.stateTimestamp, [status]);

    const onStart = () => {
        const startAt = startAtInput.current.value;
        startBtn.current.element.setAttribute('disabled', 'disabled');
        statusLbl.current.textContent = 'Starting...';
        Axios.post(`${apiBase}/api/operations/${operationId}/start`, startAt)
            .then((response) => {
                setRefresh(!refresh);
            })
            .catch((error) => alert(error));
    };
    const onStop = () => {
        if (window.confirm('Confirm operation cancelling')) {
            stopBtn.current.element.setAttribute('disabled', 'disabled');
            statusLbl.current.textContent = 'Cancelling...';

            Axios.post(`${apiBase}/api/operations/${operationId}/stop`)
                .then((response) => {
                    setRefresh(!refresh);
                    onCancelled();
                })
                .catch((error) => alert(error));
        }
    };
    useEffect(() => {
        const finalize = () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
        finalize();
        if (state === 'Scheduled') {
            timeout = setTimeout(() => setRefresh(r => !r), date - Date.now());
        } else if (state === 'InProgress') {
            onStarted();
            interval = setInterval(() => setRefresh(r => !r), 5000);
        } else if (state === 'Completed') {
            onCompleted();
        }
        return finalize;
    }, [state, date, onCompleted, onStarted]);

    return (
        status &&
        <div style={{ display: 'flex', flexWrap: 'nowrap', alignItems: 'baseline' }} >
            <form style={{ display: 'flex', flexWrap: 'nowrap', alignItems: 'baseline' }}>
                <Label>
                    <span className='text-nowrap me-2'>
                        {state === 'Idle' && 'Start at '}
                        {state === 'Scheduled' && 'Will start at'}
                        {state === 'InProgress' && 'Started at '}
                        {state === 'Completed' && 'Completed at '}
                        {state === 'Cancelled' && 'Cancelled at '}
                        {state === 'Faulted' && 'Checked at '}
                    </span>
                </Label>
                {state === 'Idle' &&
                    <DateTimePicker
                        ref={startAtInput}
                        min={new Date()}
                        defaultValue={new Date(date)}
                        format={'dd MMMM HH:mm'}
                    />
                }
                {!(state === 'Idle') &&
                    <Input value={formatDate(new Date(date), 'dd MMMM HH:mm:ss')} disabled></Input>
                }
                <span ref={statusLbl} className='mx-2'>
                    {status && state}
                </span>
            </form>
            <Button icon='play' ref={startBtn}
                disabled={!(state === 'Idle')}
                className='ms-2'
                onClick={onStart}>Start</Button>
            <Button icon='stop' ref={stopBtn}
                disabled={state === 'Idle' || state === 'Completed' || state === 'Cancelled'}
                className='ms-2'
                onClick={onStop}>Stop</Button>
        </div>
    );
}
