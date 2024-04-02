import React, { useEffect, useState } from 'react';
import {
    Card, CardTitle, CardText, CardDeck,
    CardSubtitle, CardBody
} from 'reactstrap';
import api from '../api';
import { useGet } from '../hooks/hooks';
import { Loading, dateToSpan, dateToHumanSpan } from '../utils/Utils';
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
                        <Card key={o.id}>
                            <CardBody>
                                <CardTitle><Link to={`/operations/${o.id}`} target='_blank'><h5>{o.processName}</h5></Link></CardTitle>
                                <CardSubtitle>{o.processDescription}</CardSubtitle>
                                <CardText>
                                    <span title={dateToSpan(o.created)}>Created {dateToHumanSpan(o.created)} ago</span><br />
                                    {o.started &&
                                        <span title={dateToSpan(o.started)}>Started {dateToHumanSpan(o.started)} ago</span>
                                    }<br />
                                    {o.completed &&
                                        <span title={dateToSpan(o.completed)}>Completed {dateToHumanSpan(o.completed)} ago</span>
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