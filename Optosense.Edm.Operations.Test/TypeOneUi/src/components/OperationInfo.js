import React, { useEffect, useState } from "react";
import { ConeStriped } from "react-bootstrap-icons";
import { useGet } from "./hooks/hooks";
import { Monitor } from "./Monitor";
import { Sensor } from "./Sensor";

let monitorInterval;

export const OperationInfo = (props) => {
    const [sensors, setSensors] = useState([...Array(20)]);
    const [lastId, setLastId] = useState(0);
    const [refresh, setRefresh] = useState(false);
    const [[data, setData]] = useGet(`${props.apiBase}/api/operations/${props.operationId}/records?lastRecordId=${lastId}`, refresh);
    if (!sensors[0]) {
        for (let i = 0; i < 20; i++) {
            sensors[i] = { addr: i };
        }

        setSensors([...sensors]);
    } else if (data && data.length > 0) {
        setLastId(data.reduce((max, el) => el.id > max ? el.id : max, 0));
        const sens = data.filter(d => d.isValid).map(r => JSON.parse(r.parameters || "{}"));
        sens.forEach(d => {
            const addr = d.ADDR !== undefined && parseInt(`0x${d.ADDR.slice(1)}`);
            if (addr !== false) {
                if (d.Sn !== undefined) sensors[addr].Serial = d.Sn;
                //sensors[addr].Serial = sensors[addr].Serial || d.Sn || null;
                const T = d.Term0 && parseInt(d.Term0);
                if (T !== undefined) sensors[addr].T = { value: T, valid: 1200 <= T && T <= 2000 };
                const S = d.Signal && parseInt(d.Signal);
                if (S !== undefined) sensors[addr].S = { value: S, valid: 1700 <= S && S <= 10000 };
                const R = d.Ref && parseInt(d.Ref);
                if (R !== undefined) sensors[addr].R = { value: R, valid: 1100 <= R && R <= 9600 };
                const I = d.Icons && parseInt(d.Icons);
                if (I !== undefined) sensors[addr].I = { value: I, valid: 100 <= I && I <= 360 };
            }
        });
        setSensors([...sensors]);
        setData([]);
    }

    useEffect(() => {
        if (props.started) {
            monitorInterval = setInterval(() => setRefresh(r => !r), 1000);
        } else {
            clearInterval(monitorInterval);
        }

        return () => clearInterval(monitorInterval);
    }, [props.started]);
    return (
        <div style={{ display: 'flex', margin: '1rem' }}>
            <Monitor {...props} sensors={sensors} style={{ flex: 2 }} />
            <div style={{ flex: 5, marginLeft: '1rem' }}>
                <h5>Sensor monitor</h5>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gridTemplateRows: 'repeat(4, 100px)',
                    gap: '1rem'
                }}>
                    {sensors.map((s, i) =>
                        <Sensor key={i} addr={i} info={s || {}} />
                    )}
                </div>
            </div>
        </div>
    );
};
