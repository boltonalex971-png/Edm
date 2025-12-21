import {Sensor} from "./Sensor";
import React from "react";

export const Sensors = ({sensors, settings}) => {
    return (
        <div>
            <div
                style={{
                    border: 'solid 1px',
                    padding: '1rem',
                    height: '92vh',
                    overflowY: 'auto'
                }}
                //onScroll={setScroll}
                //ref={inputRef}
            >
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gridTemplateRows: 'repeat(auto, 100px)',
                    gap: '1rem'
                }}>
                    {sensors && sensors.map((s, i) =>
                        <Sensor key={i} addr={i} info={s || {}} settings={settings} />
                    )}
                </div>
            </div>
        </div>
    )
}