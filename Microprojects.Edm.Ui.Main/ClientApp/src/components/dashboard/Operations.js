import React, {useEffect, useState} from 'react';
import {
    Card, CardTitle, CardText, CardDeck,
    CardSubtitle, CardBody, Nav, NavItem, NavLink, NavbarBrand
} from 'reactstrap';
import api from '../api';
import {useGet} from '../hooks/hooks';
import {Loading, dateToSpan, dateToHumanSpan, utcDateToLocal} from '../utils/Utils';
import {NavLink as Link, useParams, useLocation} from "react-router-dom";

let interval;

const Operations = () => {
    let location = useLocation();
    let {when} = useParams();
    const path = location.pathname.replace(`/${when}`, '');
    return (
        <div>
            <Nav style={{ marginBottom: '0.5rem' }}>
                <NavItem>
                    <NavLink tag={Link} to={`${path}/running`}>
                        <span className={when === 'running' || !(when?.length) ? 'text-dark' : 'text-primary'}>&#9211; Running</span>
                    </NavLink>
                </NavItem>
                <NavItem>
                    <NavLink tag={Link} to={`${path}/today`}>
                        <span className={when === 'today' ? 'text-dark' : 'text-primary'}>&#9212; Today</span>
                    </NavLink>
                </NavItem>
            </Nav>
            <OperationsWhen period={when ?? 'running'} />
        </div>
    )
}

const OperationsWhen = ({period}) => {
    const [time, setTime] = useState();
    const [[operations]] = useGet(`${api.operations}/${period}`, [time, period]);
    useEffect(() => {
        interval = setInterval(() => setTime(Date.now), 10000);
        return () => clearInterval(interval);
    }, []);
    return (
        <>
            {!operations && <Loading/>}
            {operations?.length === 0 && 
                <p>No operation is running at this moment</p> 
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
                            <CardBody>
                                <CardTitle><h5>{o.processName}</h5></CardTitle>
                                <CardSubtitle>{o.processDescription}</CardSubtitle>
                                <CardText>
                                    <span title={dateToSpan(utcDateToLocal(o.created))}>
                                        Created {dateToHumanSpan(utcDateToLocal(o.created))}
                                    </span><br/>
                                    {o.started &&
                                        <span
                                            title={dateToSpan(utcDateToLocal(o.started))}>Started {dateToHumanSpan(utcDateToLocal(o.started))}</span>
                                    }<br/>
                                    {o.completed &&
                                        <span
                                            title={dateToSpan(utcDateToLocal(o.completed))}>Completed {dateToHumanSpan(utcDateToLocal(o.completed))}</span>
                                    }<br/>
                                </CardText>
                            </CardBody>
                        </Card>
                    )}
                </CardDeck>
            }
        </>
    );
};

export default Operations;