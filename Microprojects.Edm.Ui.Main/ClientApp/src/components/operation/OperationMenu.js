import React, {useRef} from 'react';
import {
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
import Axios from 'axios';
import {useDialog} from "../hooks/DialogHooks";
import useSignalR from "../hooks/signalRHooks.ts";
import api from "../api.js";

export function OperationMenu({operation, to}) {
    const [collapsed, setCollapsed] = useState(true);
    const toggleNavbar = () => {
        setCollapsed(!collapsed);
    };
    return (
        <header style={{width: '100%'}}>
            <Navbar color="light" expand="md" light className="d-inline-flex justify-content-between"
                    style={{width: '100%', paddingRight: '40px'}}>
                <NavbarBrand>#{operation.id}&nbsp;<strong>{operation.process.name}</strong></NavbarBrand>
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
                <OperationToolbar operation={operation} />
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

function OperationToolbar({operation}) {
    const [status, setStatus] = 
        useState({state: operation.state, stateTimestamp: operation.stateTimestamp})
    const stopBtn = useRef(null);
    const startBtn = useRef(null);
    const copyBtn = useRef(null);
    const statusLbl = useRef(null);
    const startAtInput = useRef();
    const {dialog, confirm, alert, warning} = useDialog()
    useSignalR(`${api.baseUrl}/hub`, `Operation-${operation.id}-lifecycle`, (message) => setStatus(message))
    const copy = (event) => {
        copyBtn.current.element.setAttribute('disabled', 'disabled');
        statusLbl.current.textContent = 'Copying...';
        Axios.post(`${api.operations}/${operation.id}`)
            .then((response) => {
                window.open(`/operations/${response.data.id}`, '_self')
            })
            .catch((error) => {
                copyBtn.current.element.removeAttribute('disabled');
                statusLbl.current.textContent = 'Failed to copy';
                alert({target: event.target, message: error.response?.data?.detail});
            });
    };
    const start = (event) => {
        const currentDate = new Date();
        const specifiedDate = startAtInput.current.value;
        const startAt = specifiedDate > currentDate ? specifiedDate : currentDate;
        startBtn.current.element.setAttribute('disabled', 'disabled');
        statusLbl.current.textContent = 'Starting...';
        Axios.post(`${api.operations}/${operation.id}/start`, startAt)
            .then((response) => {
            })
            .catch((error) => {
                startBtn.current.element.removeAttribute('disabled');
                statusLbl.current.textContent = 'Faulted';
                alert({target: event.target, message: error.response?.data?.detail});
            });
    };
    const stop = (event) => warning({
            target: event.target,
            message: 'Cancel the operation?',
            onConfirm: () => {
                stopBtn.current.element.setAttribute('disabled', 'disabled');
                statusLbl.current.textContent = 'Cancelling...';
                Axios.post(`${api.operations}/${operation.id}/stop`)
                    .catch((error) => alert({
                        target: event.target,
                        message: error.response?.data?.detail
                    }))
            }
        })

const complete = (event) => confirm(
    {
        target: event.target,
        message: 'Complete the operation?',
        onConfirm: () => {
            stopBtn.current.element.setAttribute('disabled', 'disabled');
            statusLbl.current.textContent = 'Completing...';
            Axios.post(`${api.operations}/${operation.id}/complete`)
                .catch((error) => alert({
                    target: event.target,
                    message: error.response?.data?.detail
                }));
        }
    })
const close = () => window.close()

return (
    status &&
    <div style={{display: 'flex', flexWrap: 'nowrap', alignItems: 'baseline'}}>
        {dialog}
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
                <Input value={formatDate(new Date(status.stateTimestamp), 'dd MMMM HH:mm:ss')} disabled></Input>
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
                hidden={status.state === 'InProgress' || status.state === 'Idle'}
                className='ms-2'
                onClick={copy}>Copy</Button>
        <Button icon='check' ref={stopBtn}
                hidden={!(status.state === 'Idle' || status.state === 'Faulted')}
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
