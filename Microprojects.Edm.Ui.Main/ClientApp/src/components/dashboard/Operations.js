import React, { useEffect, useState } from 'react';
import {
    Card, CardTitle, CardText, CardDeck,
    CardSubtitle, CardBody
} from 'reactstrap';
import api from '../api';
import { useGet } from '../hooks/hooks';
import {Loading, dateToSpan, dateToHumanSpan, utcDateToLocal} from '../utils/Utils';
import { Link } from 'react-router-dom';
import Axios from 'axios';

let interval;

const Operations = () => {
    const [time, setTime] = useState();
    const [[operations]] = useGet(`${api.operations}/running`, [time]);
    useEffect(() => {
        interval = setInterval(() => setTime(Date.now), 10000);
        return () => clearInterval(interval);
    }, []);
    return (
        <>
            {!operations && <Loading />}
            {operations &&
                <CardDeck style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
                    {operations.map((o) =>
                        <Card key={o.id} onClick={() => window.open(`/operations/${o.id}`, '_blank')} style={{cursor: 'pointer'}} 
                              className={'bg-gradient ' + (o.state === 'Faulted' ? 'bg-danger text-light' : o.state === 'Idle' ? 'bg-warning text-dark' : o.state === 'InProgress' ? 'bg-success text-light' : 'bg-white text-dark') }
                        > 
                            <CardBody>
                                <CardTitle><h5>{o.processName}</h5></CardTitle>
                                <CardSubtitle>{o.processDescription}</CardSubtitle>
                                <CardText>
                                    <span title={dateToSpan(utcDateToLocal(o.created))}>
                                        Created {dateToHumanSpan(utcDateToLocal(o.created))}
                                    </span><br />
                                    {o.started &&
                                        <span title={dateToSpan(utcDateToLocal(o.started))}>Started {dateToHumanSpan(utcDateToLocal(o.started))}</span>
                                    }<br />
                                    {o.completed &&
                                        <span title={dateToSpan(utcDateToLocal(o.completed))}>Completed {dateToHumanSpan(utcDateToLocal(o.completed))}</span>
                                    }<br />
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