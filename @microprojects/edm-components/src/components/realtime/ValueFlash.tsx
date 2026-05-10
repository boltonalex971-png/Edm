import React, {useEffect, useRef, useState} from 'react';
import styles from './ValueFlash.module.scss';

// HANDOFF · v2 extensions.html 04c.1 · ValueFlash primitive.
// Briefly tints the background when the wrapped value changes — the
// operator's eye catches the change without needing to compare digits.
// Used in operator dashboards (counters, elapsed timers, defect counts).

type FlashKind = 'accent' | 'run' | 'warn' | 'fault';

interface ValueFlashProps {
    value: React.ReactNode;
    kind?: FlashKind;
    /* Override the change-detection key. Useful when `value` is a complex
       node — pass the underlying scalar so renders don't trigger flashes. */
    flashKey?: string | number;
    className?: string;
}

const FLASH_DURATION = 600;

export function ValueFlash({value, kind = 'accent', flashKey, className}: ValueFlashProps) {
    const key = flashKey !== undefined ? flashKey : String(value);
    const prevRef = useRef(key);
    const [flashing, setFlashing] = useState(false);

    useEffect(() => {
        if (prevRef.current === key) return;
        prevRef.current = key;
        setFlashing(true);
        const t = window.setTimeout(() => setFlashing(false), FLASH_DURATION);
        return () => window.clearTimeout(t);
    }, [key]);

    const kindClass = kind !== 'accent' ? styles[kind] : '';
    const flashingClass = flashing ? styles.flashing : '';

    return (
        <span className={`${styles.valueFlash} ${flashingClass} ${kindClass} ${className || ''}`}>
            {value}
        </span>
    );
}
