import { Button } from "@progress/kendo-react-buttons";
import { Dialog, DialogActionsBar, Window } from "@progress/kendo-react-dialogs";
import { Field, Form, FormElement } from "@progress/kendo-react-form";
import { NumericTextBox } from "@progress/kendo-react-inputs";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Countdown } from "./Countdown";
import { useGet } from "./hooks/hooks";
import { Monitor } from "./Monitor";
import './OperationInfo.scss';
import { Profile } from "./Profile";


let monitorInterval, stepInterval;

export const OperationInfo = ({ settings, started }) => {
    const { apiBase, operationId } = useOutletContext();
    const [lastId, setLastId] = useState(0);
    const [steps, setSteps] = useState([]);
    const [refresh, setRefresh] = useState(false);
    const [stepRefresh, setStepRefresh] = useState(false);
    const [[data, setData]] = useGet(`${apiBase}/api/operations/${operationId}/records?lastRecordId=${lastId}`, [refresh]);
    const [[step, setStep], stepLoading] = useGet(`${apiBase}/api/operator/${operationId}/state`, [stepRefresh]);
    const [params, setParams] = useState({});
    if (data && data.length > 0) {
        setLastId(data.reduce((max, el) => el.id > max ? el.id : max, 0));
        let paramsChanged = false;
        data.forEach(r => {
            const parameters = JSON.parse(r.parameters || '{}');
            Object.keys(parameters).forEach(k => {
                paramsChanged = true;
                const currValue = Math.round(parameters[k] * 100) / 100;
                params[k] = currValue;
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
                setSteps(cache => [...cache, stepView]);
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

    const handleSubmit = (e) => {
        axios.post(`${apiBase}/api/operator/${operationId}/response`, e.values)
            .then((response) => {
                setStep(null);
            })
    };

    return (
        <div className="desktop">
            {step && <Step step={step} onSubmit={handleSubmit} />}
            <div className="left wrapper">
                <div className="profile" style={{ backgroundColor: settings.panels.profile.color }}>
                    <Profile steps={steps} params={params} />
                </div>
                {settings.params.filter(p => p.panel === 'mainParams').map(p =>
                    <Parameter key={p.name} className='main-param' settings={p}
                        value={params[p.name]}
                        color={settings.panels.mainParams.color}
                    />
                )}
            </div>
            <div className="right wrapper">
                {settings.params.filter(p => p.panel === 'envParams').map(p =>
                    <Parameter key={p.name} className='env-param' settings={p}
                        value={params[p.name]}
                        color={settings.panels.envParams.color}
                    />
                )}
                {settings.params.filter(p => p.panel === 'otherParams').map(p =>
                    <Parameter key={p.name} className='other-param' settings={p}
                        value={params[p.name]}
                        color={settings.panels.otherParams.color}
                    />
                )}
            </div>
        </div>
    );
};

const Parameter = ({ settings, value, className, color }) => {
    return (
        <div className={className} style={{ backgroundColor: color }}>
            <p dangerouslySetInnerHTML={{ __html: settings.title.replace('\\', '<br/>') }} ></p>
            <p>{settings.prefix} {value || '---'} {settings.units}</p>
        </div>
    );
}

const Step = ({ step, onSubmit }) => {

    const [current] = useState({ params: step.parameters && JSON.parse(step.parameters), ...step });

    return (
        // <Window title={step.command} className='action-window'
        //     closeButton='no' draggable={false} modal={true} maximizeButton='no' minimizeButton='no'
        // >
        <Dialog title={<Countdown start={current.responseTime} />} closeIcon={false} >
            <Form
                key={current.order}
                onSubmitClick={onSubmit}
                render={(formRenderProps) => (
                    <FormElement>
                        <div className="action-window">
                            <div className="form">
                                <p>{current.description}</p>

                                {current.params && current.params.map(p =>
                                    <span key={p} className='value'>
                                        <label>{p}</label>
                                        <Field name={p} component={NumericTextBox} />
                                    </span>
                                )}
                            </div>
                            <div className="button" >
                                <DialogActionsBar>
                                    <Button
                                        type='submit'
                                        title='Completed'
                                        icon='check-outline'
                                        themeColor='primary'
                                    >Completed</Button>
                                </DialogActionsBar>
                            </div>
                        </div>
                    </FormElement>
                )}
            />
        </Dialog>);
};

// const params = [
//     { name: 'pressure-in-chamber', value: 760 },
//     { name: 'wafer-temp-in-carusel', value: 244 },
//     { name: 'warm-up-time', value: 130000 },
// ];

// const options = {
//     panels: {
//         profile: { color: 'aqua' },
//         mainParams: { color: 'bisquit' },
//         envParams: { color: 'rgb(232, 215, 242)' },
//         otherParams: { color: 'cornsilk' },
//     },
//     params: [
//         { name: 'pressure-in-chamber', prefix: 'P =', title: 'Давление в камере', units: 'мм.рт.ст.', panel: 'mainParams' },
//         { name: 'wafer-temp-in-carusel', prefix: 't =', title: 'Температура подложек\nв карусели', units: '°C', panel: 'mainParams' },
//         { name: 'warm-up-time', prefix: 't =', title: 'Время прогрева\n(по достижению уставки)', units: 'с', panel: 'mainParams' },
//         { name: 'room-temperature', prefix: 't =', title: 'Температура\n в помещении', units: '°C', panel: 'envParams' },
//         { name: 'room-humidity', prefix: 'Rh =', title: 'Относительная влажность\n в помещении', units: '%', panel: 'envParams' },
//         { name: 'hinge-weight', prefix: 'm =', title: 'Масса навески:', units: 'гр', panel: 'envParams' },
//         { name: 'pressure-under-cap', prefix: 'P =', title: 'Давление в подколпачном\n пространстве', units: 'мм.рт.ст.', panel: 'otherParams' },
//         { name: 'carusel-temperature', prefix: 't =', title: 'Температура карусели', units: '°C', panel: 'otherParams' },
//         { name: 'evaporator-temperature', prefix: 't =', title: 'Температура испарителя:', units: '°C', panel: 'otherParams' },
//         { name: 'param-4', prefix: '', title: 'ПАРАМЕТР №4', units: '', panel: 'otherParams' },
//         { name: 'param-5', prefix: '', title: 'ПАРАМЕТР №5', units: '', panel: 'otherParams' },
//         { name: 'param-6', prefix: '', title: 'ПАРАМЕТР №6', units: '', panel: 'otherParams' },
//     ]
// }
