import React from 'react';
import {
    ErrorOutline as ErrorIcon,
    WarningAmberOutlined as WarnIcon,
    CheckCircleOutline as OkIcon,
    SyncOutlined as AsyncIcon,
} from '@mui/icons-material';
import styles from './Field.module.scss';

// HANDOFF · v2 forms.html 04d.2 · field with validation states.
// Renders a mono-eyebrow label, a native input/textarea/select with v2
// chrome, and an optional severity-tinted help line. Native input keeps
// React event semantics (e.target.name / e.target.value) so it slots into
// the existing Editor's `handleChange` plumbing without ceremony.

export type FieldState = 'pristine' | 'invalid' | 'warn' | 'async' | 'ok';

interface CommonProps {
    label: string;
    name: string;
    required?: boolean;
    state?: FieldState;
    help?: React.ReactNode;
    full?: boolean;
}

interface InputFieldProps extends CommonProps {
    kind?: 'input';
    type?: 'text' | 'number' | 'email' | 'url';
    value?: string | number;
    placeholder?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    disabled?: boolean;
}

interface TextareaFieldProps extends CommonProps {
    kind: 'textarea';
    value?: string;
    placeholder?: string;
    rows?: number;
    onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    disabled?: boolean;
}

interface SelectOption {
    value: string;
    label: string;
}

interface SelectFieldProps extends CommonProps {
    kind: 'select';
    value?: string;
    options: SelectOption[];
    placeholder?: string;
    onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    disabled?: boolean;
}

type FieldProps = InputFieldProps | TextareaFieldProps | SelectFieldProps;

const STATE_ICON: Record<Exclude<FieldState, 'pristine'>, React.ComponentType<{ fontSize?: 'inherit' }>> = {
    invalid: ErrorIcon,
    warn: WarnIcon,
    async: AsyncIcon,
    ok: OkIcon,
};

export function Field(props: FieldProps) {
    const { label, name, required, state = 'pristine', help, full } = props;
    const stateClass = state !== 'pristine' ? styles[state] : '';
    const Icon = state !== 'pristine' ? STATE_ICON[state] : null;

    return (
        <div className={`${styles.field} ${stateClass} ${full ? styles.full : ''}`}>
            <label className={styles.label} htmlFor={name}>
                {label}
                {required && <span className={styles.req}>·</span>}
            </label>
            {props.kind === 'textarea' ? (
                <textarea
                    id={name}
                    name={name}
                    className={styles.textarea}
                    value={props.value ?? ''}
                    placeholder={props.placeholder}
                    rows={props.rows ?? 3}
                    onChange={props.onChange}
                    disabled={props.disabled}
                />
            ) : props.kind === 'select' ? (
                <select
                    id={name}
                    name={name}
                    className={styles.select}
                    value={props.value ?? ''}
                    onChange={props.onChange}
                    disabled={props.disabled}
                >
                    {props.placeholder !== undefined && (
                        <option value="">{props.placeholder}</option>
                    )}
                    {props.options.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                </select>
            ) : (
                <input
                    id={name}
                    name={name}
                    type={props.type ?? 'text'}
                    className={styles.input}
                    value={props.value ?? ''}
                    placeholder={props.placeholder}
                    onChange={props.onChange}
                    disabled={props.disabled}
                />
            )}
            {help && (
                <span className={styles.help}>
                    {Icon && <Icon fontSize="inherit" />}
                    {help}
                </span>
            )}
        </div>
    );
}
