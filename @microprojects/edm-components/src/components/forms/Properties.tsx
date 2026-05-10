import React from 'react';
import styles from './Properties.module.scss';

// HANDOFF · v2 patterns.html PAT-01 · zone-2 read-only properties grid.
// Pair `Properties` (the grid) with `Property` (each field). The `mono`
// flag on a Property switches the value to JetBrains Mono for IDs/codes;
// `multiline` removes the ellipsis for long descriptions.

interface PropertiesProps {
    children: React.ReactNode;
}

export function Properties({ children }: PropertiesProps) {
    return <div className={styles.properties}>{children}</div>;
}

interface PropertyProps {
    label: string;
    value?: React.ReactNode;
    children?: React.ReactNode;
    mono?: boolean;
    muted?: boolean;
    multiline?: boolean;
    full?: boolean;
    placeholder?: string;
}

export function Property({
    label,
    value,
    children,
    mono,
    muted,
    multiline,
    full,
    placeholder = '—',
}: PropertyProps) {
    const content = children ?? value;
    const isEmpty = content === null || content === undefined || content === '';
    const valueClass = [
        styles.value,
        mono ? styles.mono : '',
        muted ? styles.muted : '',
        multiline ? styles.multiline : '',
    ].filter(Boolean).join(' ');

    return (
        <div className={`${styles.field} ${full ? styles.full : ''}`}>
            <span className={styles.label}>{label}</span>
            <span className={valueClass}>
                {isEmpty ? <span className={styles.placeholder}>{placeholder}</span> : content}
            </span>
        </div>
    );
}
