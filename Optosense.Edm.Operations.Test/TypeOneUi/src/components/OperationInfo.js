import React, { useEffect, useState } from "react"
import { useGet } from "./hooks/hooks";
import { Monitor } from "./Monitor";
import { Sensor } from "./Sensor";
import { SmartScroll, SmartScrollContent } from "./SmartScroll";
import { types, useOperationData } from '@microprojects/react-utils'

let monitorInterval;

export const OperationInfo = (props) => {
    const [capacity, setCapacity] = useState(-1);
    const [sensors, setSensors] = useState();
    const [refresh, setRefresh] = useState(false);
    const [[data, setData]] = useGet(`${props.apiBase}/api/operations/${props.operationId}/criteria`, refresh); //records?lastRecordId=${lastId}`, refresh);
    const [[devices]] = useGet(`${props.apiBase}/api/operations/${props.operationId}/devices`);
    const [[status]] = useGet(`${props.apiBase}/api/operations/${props.operationId}/status`);
    const [params] = useOperationData(types.operationDataType);
    useEffect(() => {
    }, [params])

    if (devices && capacity === -1) {
        const options = JSON.parse(devices[0]?.options || 20)
        setCapacity(options?.capacity || 0);
    }

    if (!sensors && capacity > -1) {
        const sens = new Array(capacity);
        for (let i = 0; i < capacity; i++) {
            sens[i] = { addr: i };
        }

        setSensors([...sens]);
    } else if (data && data.length > 0) {
        data.forEach(d => {
            const addr = d.selector !== undefined && parseInt(`0x${d.selector.slice(1)}`);
            if (addr !== false) {
                //if (d.Sn !== undefined) sensors[addr].Serial = d.Sn;
                //sensors[addr].Serial = sensors[addr].Serial || d.parameters.Sn || null;
                const attr = d.auditCriterionParam.slice(0, 1);
                sensors[addr][attr] = { value: d.result, valid: d.valid };
            }
        });
        setSensors([...sensors]);
        setData([]);
    }

    useEffect(() => {
        if (props.started && data && status && status !== 'Abandoned') {
            monitorInterval = setInterval(() => setRefresh(r => !r), 10000);
        } else {
            clearInterval(monitorInterval);
        }

        return () => clearInterval(monitorInterval);
    }, [props.started, status]);
    return (
        <SmartScroll offtop={10} style={{ display: 'flex', margin: 10 }}>
            <div style={{ flex: 1 }}>
                <SmartScrollContent style={{ flex: 1 }}>
                    <Monitor {...props} sensors={sensors || []} />
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
                            <Sensor key={i} addr={i} info={s || {}} />
                        )}
                    </div>
                </SmartScrollContent>
            </div>
        </SmartScroll >
    );
};
