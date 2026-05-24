import React, { useState } from "react";
import './OperationInfo.scss';
import { Profile } from "./Profile";
import format from 'number-format.js'
import {PluginMessageTypes, useOperationData} from "@microprojects/edm-components/iframe";

export const OperationInfo = ({ settings, records, profile }) => {
    const [steps, setSteps] = useState([]);
    const [params, setParams] = useState({});
    useOperationData(PluginMessageTypes.OPERATOR, undefined, (o) => {
        setSteps((s) => [...s, o.command])
    })
    useOperationData(PluginMessageTypes.DEVICE, records || [], (d) => {
        let paramsChanged = false;
        d.forEach(r => {
            const parameters = r.parameters || {}
            Object.keys(parameters).forEach(k => {
                paramsChanged = true;
                // const currValue = Math.round(parameters[k] * 100) / 100;
                params[k] = parameters[k]; //currValue;
            });
        });
        if (paramsChanged) {
            setParams({...params});
        }
    })

    return (
        <div className="desktop" style={{ height: '100vh' }}>
            <div className="left wrapper">
                <div className="profile" style={{ backgroundColor: settings.panels.profile.color }}>
                    <Profile steps={steps} params={params} profile={profile} />
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
    const formatNumber = (fmt, num) => {
        if (num === undefined || num == null) return '---'
        if (Number.isNaN(num)) return num

        const [expFormat] = fmt?.match(/[#\d]*E/i) || []
        if (!expFormat?.length) return format(fmt, num)

        const [mantissa, exp] = num.toExponential().split('e')
        const expSign = expFormat.slice(-1)
        const formattedMantissa = mantissa.padEnd(20, '0').substring(0, expFormat.length > 2 ? expFormat.length : mantissa.length)
        const [zeroEnding] = formattedMantissa.match(/0*$/)
        const [_, arbitraryEnding] = expFormat.match(/([#1-9]*)E/i)
        const packedMantissa = formattedMantissa.substring(0, formattedMantissa.length - Math.min(zeroEnding.length, arbitraryEnding.length) || 0)
        const result = fmt.replace(expFormat, `${packedMantissa} ${expSign}${exp}`)
        return result
    }
    return (
        <div className={className} style={{ backgroundColor: color }}>
            <p dangerouslySetInnerHTML={{ __html: settings.title && settings.title.replace('\\', '<br/>') || settings.name}} ></p>
            <p>{formatNumber(settings.format, value)}</p>
        </div>
    );
}
