import React, {useEffect, useState} from 'react';
import {
    Card, CardTitle, CardText, CardDeck,
    CardSubtitle, CardBody, Nav, NavItem, NavLink, NavbarBrand
} from 'reactstrap';
import api from '../api';
import {useGet} from '../hooks/hooks';
import {Loading, dateToSpan, dateToHumanSpan, utcDateToLocal} from '../utils/Utils';
import {NavLink as Link, useParams, useLocation} from "react-router-dom";
import MoreVertIcon from '@mui/icons-material/MoreVert'
import {Menu, MenuItem} from "@mui/material";
import Axios from "axios";
import {useDialog} from "../hooks/DialogHooks.js";

let interval;

const Operations = () => {
    let location = useLocation();
    let {when} = useParams();
    const path = location.pathname.replace(`/${when}`, '');
    return (
        <div>
            <Nav style={{marginBottom: '0.5rem'}}>
                <NavItem>
                    <NavLink tag={Link} to={`${path}/running`}>
                        <span className={when === 'running' || !(when?.length) ? 'text-dark' : 'text-primary'}>
                            &#9211; Running
                        </span>
                    </NavLink>
                </NavItem>
                <NavItem>
                    <NavLink tag={Link} to={`${path}/today`}>
                        <span className={when === 'today' ? 'text-dark' : 'text-primary'}>
                            &#9312; Today
                        </span>
                    </NavLink>
                </NavItem>
                <NavItem>
                    <NavLink tag={Link} to={`${path}/week`}>
                        <span className={when === 'week' ? 'text-dark' : 'text-primary'}>
                            &#9318; Week
                        </span>
                    </NavLink>
                </NavItem>
            </Nav>
            <OperationsWhen period={when ?? 'running'}/>
        </div>
    )
}

const OperationsWhen = ({period}) => {
    const [menu, setMenu] = useState(null);
    const [time, setTime] = useState();
    const [[operations]] = useGet(`${api.operations}/${period}`, [time, period]);
    const {dialog, alert} = useDialog()

    const openCardMenu = (ev, operationId) => {
        ev.stopPropagation();
        setMenu({target: ev.currentTarget, id: operationId});
    }
    const closeCardMenu = (ev) => {
        setMenu(null);
    }
    const completeOperation = (ev) => {
        // stopBtn.current.element.setAttribute('disabled', 'disabled');
        // statusLbl.current.textContent = 'Completing...';
        const card = menu?.target.closest('.card')
        const classBackup = card.className
        const opacityBackup = card.style.opacity 
        card.className = card.className.replace(/bg-\w*/g, 'bg-light')
        card.style.opacity = '0.3';
        Axios.post(`${api.operations}/${menu.id}/complete`)
            .then((response) => {
                setTime(Date.now)
            })
            .catch((error) => {
                alert({
                    target: menu.target,
                    message: error.response?.data?.detail,
                })
                card.className = classBackup
                card.style.opacity = opacityBackup;
            })
            .finally(() => setMenu(null));
    }
    const copyOperation = (ev) => {
        Axios.post(`${api.operations}/${menu.id}`)
            .then((response) => {
                window.open(`/operations/${response.data.id}`, '_blank');
            })
            .catch((error) => {
                alert({target: menu.target, message: error.response?.data?.detail});
            })
            .finally(() => setMenu(null));
    };

    useEffect(() => {
        interval = setInterval(() => setTime(Date.now), 10000);
        return () => clearInterval(interval);
    }, []);
    return (
        <>
            {dialog}
            {!operations && <Loading/>}
            {operations?.length === 0 &&
                <p>
                    {period === 'today' ?
                        'No operation was completed today' : period === 'week' ?
                            'No operation was completed last 7 days' :
                            'No operation is running at the moment'
                    }
                </p>
            }
            {operations &&
                <CardDeck style={{display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem'}}>
                    {operations.map((o) =>
                        <Card key={o.id} onClick={() => window.open(`/operations/${o.id}`, '_blank')}
                              style={{cursor: 'pointer'}}
                              className={'bg-gradient ' + (
                                  o.state === 'Faulted' ? 'bg-danger text-light' :
                                      o.state === 'Idle' ? 'bg-warning text-dark' :
                                          o.state === 'InProgress' ? 'bg-success text-light' :
                                              'bg-light text-dark')}
                        >
                            <span style={{position: 'absolute', top: 2, right: 3}}>
                                <MoreVertIcon fontSize='small'
                                              onClick={(ev) => openCardMenu(ev, o.id)}/>
                            </span>
                            <CardBody style={{padding: '5px 16px 16px 16px'}}>
                                <CardTitle style={{width: '90%'}}>
                                    <div style={{
                                        fontSize: 'smaller',
                                        display: 'flex',
                                        flexDirection: 'row',
                                        justifyContent: 'space-between'
                                    }}>
                                        <span>#{o.id}</span>
                                        <span>{o.workplaceName}</span>
                                        <span>{o.author ?? 'Operator'}</span>
                                    </div>
                                </CardTitle>
                                <CardText style={{display: 'flex', flexDirection: 'column'}}>
                                    <span style={{fontSize: '1.4rem', fontWeight: 'bolder'}}>
                                        {o.processName}
                                    </span>
                                    <span title={dateToSpan(utcDateToLocal(o.created))}>
                                        Created {dateToHumanSpan(utcDateToLocal(o.created))}
                                    </span>
                                    {o.started &&
                                        <span title={dateToSpan(utcDateToLocal(o.started))}>
                                            Started {dateToHumanSpan(utcDateToLocal(o.started))}
                                        </span>
                                    }
                                    {o.completed &&
                                        <span title={dateToSpan(utcDateToLocal(o.completed))}>
                                            Completed {dateToHumanSpan(utcDateToLocal(o.completed))}
                                        </span>
                                    }
                                    {o.cancelled &&
                                        <span title={dateToSpan(utcDateToLocal(o.cancelled))}>
                                            Cancelled {dateToHumanSpan(utcDateToLocal(o.cancelled))}
                                        </span>
                                    }
                                </CardText>
                            </CardBody>
                        </Card>
                    )}
                    <Menu autoFocus={false}
                          anchorEl={menu?.target}
                          open={!!menu}
                          onClose={closeCardMenu}
                          anchorOrigin={{
                              vertical: 'top',
                              horizontal: 'right',
                          }}
                          transformOrigin={{
                              vertical: 'top',
                              horizontal: 'left',
                          }}
                    >
                        {period === 'running' && 
                            <MenuItem onClick={completeOperation}>Complete</MenuItem>
                        }
                        <MenuItem onClick={copyOperation}>Copy</MenuItem>
                    </Menu>
                </CardDeck>
            }
        </>
    );
};

export default Operations;