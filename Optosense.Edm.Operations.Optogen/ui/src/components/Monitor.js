import { Button } from '@progress/kendo-react-buttons';
import React, { useEffect, useRef } from 'react';
import { useState } from 'react';
import { Input, NumericTextBox } from '@progress/kendo-react-inputs';
import { useGet } from './hooks/hooks';
import { Field, Form, FormElement } from '@progress/kendo-react-form';
import axios from 'axios';
import { Countdown } from './Countdown';
import { useOutletContext } from 'react-router-dom';

let monitorInterval, stepInterval;

export function Monitor({ started }) {
    const { operationId, apiBase } = useOutletContext();
    const inputRef = useRef();
    const [warn, setWarn] = useState(false);
    const [elapsed, setElapsed] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [lastId, setLastId] = useState(0);
    const [cache, setCache] = useState([]);
    const [refresh, setRefresh] = useState(false);
    const [stepRefresh, setStepRefresh] = useState(false);
    const [current, setCurrent] = useState();
    const [[data, setData]] = useGet(`${apiBase}/api/operations/${operationId}/records?lastRecordId=${lastId}`, refresh);
    const [[step, setStep], stepLoading] = useGet(`${apiBase}/api/operator/${operationId}/state`, stepRefresh);
    const [params, setParams] = useState({});
    if (data && data.length > 0) {
        setLastId(data.reduce((max, el) => el.id > max ? el.id : max, 0));
        let paramsChanged = false;
        data.forEach(r => {
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
            if (step) {
                clearInterval(stepInterval);
                const stepView = step.command;
                setCache(cache => [...cache, stepView]);
                const stepParameters = step.parameters && JSON.parse(step.parameters);
                const currStep = { params: stepParameters, ...step };
                setCurrent(currStep);
            } else if (!stepLoading) {
                stepInterval = setInterval(() => setStepRefresh(r => !r), 5000);
            }
        }

        return () => {
            clearInterval(stepInterval);
        }
    }, [started, step, stepLoading]);

    useEffect(() => {
        if (started) {
            monitorInterval = setInterval(() => setRefresh(r => !r), 1000);
        } else {
            clearInterval(monitorInterval);
        }

        return () => {
            clearInterval(monitorInterval);
        }
    }, [started]);

    useEffect(() => {
        if (!scrolled) {
            inputRef.current.scrollTop = inputRef.current.scrollHeight;
        }
    });

    const handleSubmit = (e) => {
        axios.post(`${apiBase}/api/operator/${operationId}/response`, e.values)
            .then((response) => {
                setCurrent(null);
                setStep(null);
                setElapsed(false);
                setWarn(false);
            })
    };

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
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                width: '30%',
                marginRight: '2rem'
            }}>
                <h3>Current step</h3>
                {current &&
                    <Form
                        key={current.order}
                        onSubmitClick={handleSubmit}
                        render={(formRenderProps) => (
                            <FormElement>
                                <div style={{ marginBottom: '2rem' }}>
                                    <p>
                                        {current.command}
                                    </p>
                                    <small>{current.description}</small>
                                </div>
                                <Countdown start={current.responseTime} />
                                {current.params && current.params.map(p =>
                                    <p key={p} >
                                        <label>{p}</label>
                                        <Field name={p} component={NumericTextBox} />
                                    </p>
                                )}
                                <Button
                                    type='submit'
                                    title='Completed'
                                    icon='check-outline'
                                    themeColor='primary'
                                    style={{ marginTop: '2rem', width: '100%' }}>Completed</Button>
                            </FormElement>
                        )}
                    />
                }
            </div>
            <div>
                <h3>Parameters</h3>
                {Object.keys(params).map(k => <p key={k}>{k}: {params[k].value} (min: {params[k].min} max: {params[k].max})</p>)}
            </div>
        </div >
    );
}