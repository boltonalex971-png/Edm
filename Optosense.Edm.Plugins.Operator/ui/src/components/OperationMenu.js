import React, { useRef } from 'react';
import { Collapse, Container, Navbar, NavbarBrand, NavbarToggler, NavItem, NavLink, Label, NavbarText, Input, Nav } from 'reactstrap';
import { Link } from 'react-router-dom';
import { DateTimePicker } from '@progress/kendo-react-dateinputs';
import './OperationMenu.css';
import { Button } from '@progress/kendo-react-buttons';
import { formatDate } from '@telerik/kendo-intl';
import { useState } from 'react';
import { useEffect } from 'react';
import { useGet } from './hooks/hooks';
import Axios from 'axios';

export function OperationMenu(props) {
    const [collapsed, setCollapsed] = useState(true);
    const toggleNavbar = () => {
        setCollapsed(!collapsed);
    };
    return (
        <header>
            <Navbar color="light" expand="md" light className="d-inline-flex justify-content-between" style={{ width: '100%' }} >
                <NavbarBrand href="/" >Operator App</NavbarBrand>
                <NavbarToggler onClick={toggleNavbar} className="mr-2" />
                {/* <Collapse className="d-inline-flex justify-content-between" isOpen={!collapsed} navbar> */}
                {/* <Nav>
                        <NavItem>
                            <NavLink href='/' className='text-dark'><span className='k-icon k-i-home'></span></NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink href="/config" className='text-dark'><span className='k-icon k-i-gear'></span></NavLink>
                        </NavItem>
                    </Nav> */}
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
    const [[operation, setOperation]] = useGet(`${apiBase}/api/operations/${operationId}`, refresh);
    const [[status]] = useGet(`${apiBase}/api/operations/${operationId}/status`, refresh);

    const startDate = operation && new Date(operation.started).getTime();
    const finishDate = operation && new Date(operation.completed).getTime();
    const defaultDate = startDate || (finishDate || Date.now());

    const scheduled = Date.now() < startDate;
    const started = !finishDate && !!startDate && !scheduled;
    const completed = !!finishDate;
    const created = !scheduled && !started && !completed;

    const startAtInput = useRef();
    const onStart = () => {
        const startAt = startAtInput.current.value;
        Axios.post(`${apiBase}/api/operations/${operationId}/start`, startAt)
            .then((response) => {
                setOperation(response.data);
                setRefresh(!refresh);
            })
            .catch((error) => alert(error));
    };
    const onStop = () => {
        Axios.post(`${apiBase}/api/operations/${operationId}/stop`)
            .then((response) => {
                setOperation(response.data);
                setRefresh(!refresh);
                onCancelled();
            })
            .catch((error) => alert(error));
    };
    useEffect(() => {
        const finalize = () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
        if (scheduled && !timeout) {
            timeout = setTimeout(() => setRefresh(r => !r), startDate - Date.now());
        } else if (started && !interval) {
            onStarted();
            interval = setInterval(() => setRefresh(r => !r), 5000);
        } else if (completed && (interval || timeout)) {
            onCompleted();
            setRefresh(r => !r);
            finalize();
        }
        return finalize;
    }, [scheduled, started, completed, onStarted, onCompleted, startDate]);
    return (
        operation &&
        <div style={{ display: 'flex', flexWrap: 'nowrap', alignItems: 'baseline' }} >
            <form style={{ display: 'flex', flexWrap: 'nowrap', alignItems: 'baseline' }}>
                <Label>
                    <span className='text-nowrap me-2'>
                        {created && 'Start at '}
                        {scheduled && 'Will start at'}
                        {started && 'Started at '}
                        {completed && 'Completed at '}
                    </span>
                </Label>
                {created &&
                    <DateTimePicker
                        ref={startAtInput}
                        min={new Date()}
                        defaultValue={new Date(defaultDate)}
                        format={'dd MMMM HH:mm'}
                    />
                }
                {!created &&
                    <Input value={formatDate(new Date(defaultDate), 'dd MMMM HH:mm:ss')} disabled></Input>
                }
                <Label className='mx-2'>
                    {status && status.state}
                </Label>
            </form>
            <Button icon='play' disabled={!created} className='ms-2' onClick={onStart}>Start</Button>
            <Button icon='stop' disabled={created || completed} className='ms-2' onClick={onStop}>Stop</Button>
        </div>
    );
}
