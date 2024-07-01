import React, { useEffect, useRef } from 'react';
import { useState } from 'react';
import { useGet } from './hooks/hooks';


export function Monitor({ sensors, started, indicators, ...props }) {
    const inputRef = useRef();
    const [scrolled, setScrolled] = useState(false);
    const index = [...sensors].reverse().findIndex(s => s.handled);
    const log = index > -1 && sensors.slice(0, sensors.length - index).map((s, i) =>
        <div key={i}>
            <span>#{i + 1} <strong>{s.serial}</strong></span>
            <div style={{ padding: '0 0 1rem 3rem', display: 'flex', flexDirection: 'column' }}>
                {indicators.map(i =>
                    s[i.parameter] &&
                    <span key={`${i.indicator}_${i.parameter}`} className={s[i.parameter].valid ? '' : 'bg-danger text-white'}>
                        {i.indicator}: {s[i.parameter].value} {s[i.parameter].valid ? 'Ok' : 'Failed'}
                    </span>
                )}
            </div>
        </div>
    );
    const polled = sensors.filter(s => s && s.serial).length;
    const setScroll = (e) => {
        const scroll = e.target.scrollHeight >= e.target.scrollTop + e.target.getBoundingClientRect().y + 10;
        setScrolled(scroll);
        // console.log(scroll, e.target.scrollHeight, e.target.scrollTop + e.target.getBoundingClientRect().y + 10, e.target);
    };
    useEffect(() => {
        if (!scrolled) {
            inputRef.current.scrollTop = inputRef.current.scrollHeight;
        }
    });
    return (
        <div style={{ ...props.style }} >
            <h5>{polled || 'No'} sensors polled</h5>
            <div
                style={{ border: 'solid 1px', padding: '1rem', backgroundColor: 'lightgrey', height: '82vh', overflowY: 'auto' }}
                onScroll={setScroll}
                ref={inputRef}
            >
                {log}
            </div>
        </div >
    );
}