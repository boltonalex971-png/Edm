import React, { useEffect, useRef } from 'react';
import { useState } from 'react';
import { useGet } from './hooks/hooks';


export function Monitor({ sensors, started, indicators, ...props }) {
    const inputRef = useRef();
    const [scrolled, setScrolled] = useState(false);
    const polled = sensors.filter(s => s && s.serial).length;
    const setScroll = (e) => {
        const scroll = e.target.scrollHeight >= e.target.scrollTop + e.target.getBoundingClientRect().y + 10;
        setScrolled(scroll);
        // console.log(scroll, e.target.scrollHeight, e.target.scrollTop + e.target.getBoundingClientRect().y + 10, e.target);
    };
    useEffect(() => {
        // TODO need to separate handle scroll from below one
        //if (!scrolled) {
        inputRef.current.scrollTop = inputRef.current.scrollHeight;
        //}
    });
    return (
        <div style={{ ...props.style }} >
            <h5>{polled || 'No'} sensors polled</h5>
            <div
                style={{ border: 'solid 1px', padding: '1rem', backgroundColor: 'lightgrey', height: '92vh', overflowY: 'auto' }}
                onScroll={setScroll}
                ref={inputRef}
            >
                {sensors.filter(s => s.handled).map((s, i) =>
                    <div key={i}>
                        <span>#{i + 1} <strong>{s.serial}</strong></span>
                        <div style={{ padding: '0 0 1rem 3rem', display: 'flex', flexDirection: 'column' }}>
                            {Object.entries(s).map(p =>
                                <span key={`${p[0]}`} className={p[1]?.valid ?? true ? '' : 'bg-danger text-white'}>
                                    {p[0]}: {p[1].value ?? p[1]} {p[1].valid === undefined ? '' : p[1].valid ? 'Ok' : 'Failed'}
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}