import React, {useState} from "react"
import {Monitor} from "./Monitor";
//import {SmartScroll, SmartScrollContent} from "./SmartScroll";
import {Log} from "./Log";
import {Sensors} from "./Sensors";
import {PluginMessageTypes, SmartScroll, SmartScrollContent, useOperationData} from "@microprojects/tools";
//import {useOperationData} from "./hooks/messagingHooks";

export const OperationInfo = ({info, settings, ...props}) => {
    const [sensors, setSensors] = useState(() => {
        const options = JSON.parse(info.devices.find(dev => dev.options?.includes('capacity'))?.options)
        const cap = parseInt(options?.capacity)
        return new Array(cap).fill({}).map((s, i) => ({addr: i}))
    });
    const [logView, setLogView] = useState(false);
    const records = useOperationData(PluginMessageTypes.DEVICE, info.records || [], (d) => {
        const serials = d.filter(r => (r.parameters || {})[settings.serial]).map(r => r.parameters)
        setSensors(sens => sens.map((s, i) => {
            const f = serials.filter(r => parseInt(`0x${r.ADDR.slice(1)}`) === i).at(-1)
            return f ? {...s, serial: f[settings.serial]} : s
        }))
    })
    const criteria = useOperationData(PluginMessageTypes.AUDIT, info.criteria || [], (m) => {
        m.forEach(d => {
            const addr = d.selector && parseInt(`0x${d.selector.slice(1)}`);
            // Ignore sensors when specified capacity less than the multi-string command can return (e.g. <SOC?>)
            if (addr !== undefined) {
                if (addr >= sensors.length) return
                const attr = d.auditCriterionParam
                setSensors(s => {
                    s[addr][attr] = {value: d.result, valid: d.valid}
                    return [...s]
                })
            }
        });
    })

    return (
        <SmartScroll offsetTop={10} style={{display: 'flex', margin: 10}}>
                <SmartScrollContent style={{flex: 1}}>
                    <Monitor {...props} sensors={sensors || []} settings={settings}/>
                </SmartScrollContent>
                <SmartScrollContent style={{flex: 4, marginLeft: '1rem'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between'}}>
                        <h5>{logView ? 'Log' : 'Sensor'} view</h5>
                        <a
                            style={{
                                color: 'blue',
                                textDecoration: 'underline',
                                textDecorationColor: '#8f867c',
                                cursor: 'pointer'
                            }}
                            onClick={() => setLogView(v => !v)}
                        >
                            Switch to {logView ? 'sensor' : 'log'} view
                        </a>
                    </div>
                    {logView &&
                        <Log {...props} records={records || []}/>
                    }
                    {!logView &&
                        <Sensors sensors={sensors || []} settings={settings} style={props.style}/> 
                    }
                </SmartScrollContent>
        </SmartScroll>
    );
};
