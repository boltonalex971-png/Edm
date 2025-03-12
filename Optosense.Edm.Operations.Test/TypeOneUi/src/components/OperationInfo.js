import React, { useEffect, useState } from "react"
import { useGet } from "./hooks/hooks";
import { Monitor } from "./Monitor";
import { Sensor } from "./Sensor";
import { SmartScroll, SmartScrollContent } from "./SmartScroll";
import { types, useOperationData } from '@microprojects/react-utils'
import axios from "axios";

let monitorInterval;

export const OperationInfo = (props) => {
    const [lastId, setLastId] = useState(0)
    const [sensors, setSensors] = useState();
    const [refresh, setRefresh] = useState(false);

    useGet(`${props.apiBase}/api/operations/${props.operationId}/devices`, [], d => {
        const options = JSON.parse(d.find(dev => dev.options?.includes('capacity'))?.options)
        const cap = parseInt(options?.capacity)
        setSensors(new Array(cap).fill({}).map((s, i) => ({ addr: i })))
        setRefresh(r => !r)
    });

    const [[status]] = useGet(`${props.apiBase}/api/operations/${props.operationId}/status`);

    useEffect(() => {
        if (!sensors) return
        axios.get(`${props.apiBase}/api/operations/${props.operationId}/criteria`)
            .then(c => {
                c.data.forEach(d => {
                    const addr = d.selector !== undefined && parseInt(`0x${d.selector.slice(1)}`);
                    if (addr !== false) {
                        const attr = d.auditCriterionParam
                        sensors[addr][attr] = { value: d.result, valid: d.valid };
                    }
                });
                axios.get(`${props.apiBase}/api/operations/${props.operationId}/records?lastRecordId=${lastId}`)
                    .then(r => {
                        setLastId(id => r.data.at(-1)?.id || id);
                        console.log(r.data);
                        const serials = r.data.filter(r => r.parameters[props.settings.serial]).map(r => r.parameters)
                        setSensors(sensors.map((s, i) => {
                            const f = serials.filter(r => parseInt(`0x${r.ADDR.slice(1)}`) === i).at(-1)
                            return f ? { ...s, serial: f[props.settings.serial] } : s
                        }))

                    }).catch(alert)
            }).catch(alert)
    }, [refresh])

    useEffect(() => {
        if (props.started && status && status !== 'Abandoned') {
            monitorInterval = setInterval(() => setRefresh(r => !r), 1000);
        } else {
            clearInterval(monitorInterval);
        }

        return () => clearInterval(monitorInterval);
    }, [props.started, status]);

    return (
        <SmartScroll offtop={10} style={{ display: 'flex', margin: 10 }}>
            <div style={{ flex: 1 }}>
                <SmartScrollContent style={{ flex: 1 }}>
                    <Monitor {...props} sensors={sensors || []} settings={props.settings} />
                </SmartScrollContent>
            </div>
            <div style={{ flex: 4, marginLeft: '1rem' }}>
                <SmartScrollContent>
                    <h5>Sensor monitor</h5>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(5, 1fr)',
                        gridTemplateRows: 'repeat(auto, 100px)',
                        gap: '1rem'
                    }}>
                        {sensors && sensors.map((s, i) =>
                            <Sensor key={i} addr={i} info={s || {}} settings={props.settings} />
                        )}
                    </div>
                </SmartScrollContent>
            </div>
        </SmartScroll >
    );
};
