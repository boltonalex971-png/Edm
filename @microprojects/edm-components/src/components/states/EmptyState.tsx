import React from 'react';
import {
    InboxOutlined as DefaultEmptyIcon,
    TouchAppOutlined as TouchAppIcon,
    Add as AddIcon,
} from '@mui/icons-material';
import {Button} from '@mui/material';
import {useTranslation} from 'react-i18next';
import styles from './StateSurface.module.scss';

// HANDOFF · v2 04c.3 · canonical empty state.
// Icon-in-circle on --surface-2, ink-1 title, ink-3 help, optional CTA.
// Use `size="sm"` inside cards (RelationTable empty), `md` for page
// sections (Operations dashboard empty), `lg` for full-page heroes
// (DetailStub-style "select something" surfaces).

type Size = 'sm' | 'md' | 'lg';

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    help?: React.ReactNode;
    action?: {label: string; onClick: () => void; icon?: React.ReactNode};
    size?: Size;
    className?: string;
}

export function EmptyState({icon, title, help, action, size = 'md', className}: EmptyStateProps) {
    return (
        <div className={`${styles.surface} ${styles[size]} ${className || ''}`}>
            <div className={styles.icon}>
                {icon || <DefaultEmptyIcon />}
            </div>
            <h3 className={styles.title}>{title}</h3>
            {help && <p className={styles.help}>{help}</p>}
            {action && (
                <div className={styles.actions}>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={action.icon || <AddIcon />}
                        onClick={action.onClick}
                    >
                        {action.label}
                    </Button>
                </div>
            )}
        </div>
    );
}

/* DetailStub kept the old "Select an Item" semantics — a thin shim that
   targets the lg surface size and the touch-app icon. Old callers keep
   working; new ones should use <EmptyState> directly. */
export function DetailStub({message, onAdd}: {message?: string; onAdd?: () => void}) {
    const {t} = useTranslation('edm-states');
    return (
        <EmptyState
            size="lg"
            icon={<TouchAppIcon />}
            title={t('detailStub.title', 'Select an item')}
            help={message || t('detailStub.help', 'Choose an item from the list on the left to view its details, or create a new item to get started.')}
            action={onAdd ? {label: t('detailStub.action', 'Create new item'), onClick: onAdd} : undefined}
        />
    );
}
