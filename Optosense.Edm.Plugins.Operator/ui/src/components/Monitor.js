import { Button } from '@progress/kendo-react-buttons';
import React, { useEffect, useRef } from 'react';
import { useState } from 'react';
import { Input } from '@progress/kendo-react-inputs';
import { useGet } from './hooks/hooks';

let monitorInterval;

export function Monitor({ operationId, apiBase, started }) {
    const inputRef = useRef();
    const [scrolled, setScrolled] = useState(false);
    const [lastId, setLastId] = useState(0);
    const [cache, setCache] = useState([]);
    const [refresh, setRefresh] = useState(false);
    const [current, setCurrent] = useState();
    const [[data, setData]] = useGet(`${apiBase}/api/operations/${operationId}/records?lastRecordId=${lastId}`, refresh);
    const [params, setParams] = useState({});
    if (data && data.length > 0) {
        setLastId(data.reduce((max, el) => el.id > max ? el.id : max, 0));
        const operator = data.filter(r => r.request === 'Set' || r.request === 'Get');
        if (operator.length > 0) {
            const newCache = [...cache, ...operator.map(r => {
                const parameters = JSON.parse(r.parameters || '{}');
                return `${parameters.Command} ${parameters.Condition || ''} (${r.status})`;
            })];
            setCache(newCache);

            const step = operator[operator.length - 1] || {};
            const stepParams = JSON.parse(step.parameters || '{}');
            const stepParameters = stepParams.Parameters && JSON.parse(stepParams.Parameters);
            const currStep = { params: { parameters: stepParameters, ...stepParams }, ...step };
            setCurrent(currStep);
        }

        let paramsChanged = false;
        data.filter(r => r.request !== 'Set' && r.request !== 'Get').forEach(r => {
            const parameters = JSON.parse(r.parameters || '{}');
            Object.keys(parameters).forEach(k => {
                paramsChanged = true;
                const currValue = Math.round(parameters[k] * 100) / 100;
                params[k] = { value: currValue, min: Math.min(params[k]?.min || currValue, currValue), max: Math.max(params[k]?.max || currValue, currValue) };
            });
        });
        if (paramsChanged) {
            setParams({ ...params });
        }

        setData([]);
    }

    useEffect(() => {
        if (started) {
            monitorInterval = setInterval(() => setRefresh(r => !r), 1000);
        } else {
            clearInterval(monitorInterval);
        }

        return () => clearInterval(monitorInterval);
    }, [started]);
    useEffect(() => {
        if (!scrolled) {
            inputRef.current.scrollTop = inputRef.current.scrollHeight;
        }
    });

    return (
        <div style={{ display: 'flex', alignItems: 'stretch' }}>
            <div style={{ display: 'flex', flexDirection: 'column', width: '40%' }}>
                <h3>Progress monitor</h3>
                <p>
                    Below you can see the operation execution progress in the real time.
                </p>
                <strong>{cache.length} records received</strong>
                <textarea
                    className='form-control'
                    style={{ width: '90%' }}
                    onScroll={(e) => setScrolled(e.target.scrollHeight >= e.target.scrollTop + e.target.getBoundingClientRect().y + 10)}
                    ref={inputRef}
                    readOnly
                    type='textarea'
                    rows={10}
                    value={cache.join('\n')}
                />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', width: '30%', marginRight: '2rem' }}>
                <h3>Current step</h3>
                {current &&
                    <>
                        <div style={{ marginBottom: '2rem' }}>
                            <p>
                                {current.params.Command}
                            </p>
                            <small>{current.params.Description}</small>
                        </div>
                        {current.params.parameters && current.params.parameters.map(p =>
                            <p>
                                <label>{p}</label>
                                <Input
                                    valid={true}
                                    type='text'
                                    maxlength={10}
                                />
                            </p>
                        )}
                        <Button title='Completed' icon='check-outline' themeColor='primary' style={{ marginTop: '2rem' }}>Completed</Button>
                    </>
                }
            </div>
            <div>
                <h3>Parameters</h3>
                {Object.keys(params).map(k => <p key={k}>{k}: {params[k].value} (min: {params[k].min} max: {params[k].max})</p>)}
            </div>
        </div>
    );
}