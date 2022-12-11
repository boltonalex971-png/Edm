import React, { useEffect, useState } from "react";

let timerInterval;

export function Countdown({ start }) {
    const [timer, setTimer] = useState(start);
    useEffect(() => {
        timerInterval = setInterval(() => setTimer(t => t - 1), 1000);
        return () => clearInterval(timerInterval);
    }, []);

    if (timer < 1) {
        clearInterval(timerInterval);
    }

    const hours = Math.floor(timer / 60 / 60);
    let rest = timer % (60 * 60);
    const minutes = Math.floor(rest / 60);
    rest = rest % (60);
    const secs = Math.floor(rest);
    const warning = timer < 61;
    const elapsing = timer < 11;

    return (
        <p
            className={(elapsing && 'text-danger' || warning && 'text-warning' || 'd-none')}
            style={{
                width: '100%',
                textAlign: 'center',
                fontSize: '3rem'
            }}>
            {`${hours}:${minutes}:${secs}`}
        </p>
    );
}