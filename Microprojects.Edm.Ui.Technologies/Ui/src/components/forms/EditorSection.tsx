import React, { useState } from 'react';
import { Check as CheckIcon, ExpandMore as ChevIcon } from '@mui/icons-material';
import styles from './EditorSection.module.scss';

// HANDOFF · v2 forms.html 04d.1 · multi-section editor.
// `done` flag swaps the number circle for a green check.
// `defaultCollapsed` lets the parent decide which sections start closed
// (typical pattern: first incomplete open, complete sections collapsed).
// `fill` is rendered as `<b>filled</b> / <total>` in the header.

interface EditorSectionProps {
    number: number | string;
    title: string;
    filled?: number;
    total?: number;
    fillNote?: string;
    done?: boolean;
    defaultCollapsed?: boolean;
    children: React.ReactNode;
}

export function EditorSection({
    number,
    title,
    filled,
    total,
    fillNote,
    done,
    defaultCollapsed,
    children,
}: EditorSectionProps) {
    const [collapsed, setCollapsed] = useState(!!defaultCollapsed);
    const showFill = filled !== undefined && total !== undefined;

    return (
        <div className={styles.section}>
            <div
                className={`${styles.header} ${collapsed ? styles.collapsed : ''}`}
                onClick={() => setCollapsed(c => !c)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setCollapsed(c => !c);
                    }
                }}
            >
                <span className={`${styles.numCircle} ${done ? styles.done : ''}`}>
                    {done ? <CheckIcon fontSize="inherit" /> : number}
                </span>
                <h4 className={styles.title}>{title}</h4>
                <span className={styles.fill}>
                    {showFill && <><b>{filled}</b> / {total} filled</>}
                    {fillNote && (showFill ? ` · ${fillNote}` : fillNote)}
                </span>
                <ChevIcon className={`${styles.chev} ${collapsed ? '' : styles.up}`} />
            </div>
            <div className={`${styles.body} ${collapsed ? styles.collapsed : ''}`}>
                {children}
            </div>
        </div>
    );
}
