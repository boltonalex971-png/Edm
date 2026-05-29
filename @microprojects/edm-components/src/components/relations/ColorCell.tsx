import {Box} from '@mui/material';
import {type CSSProperties, useEffect} from 'react';

// Seven app-themed rainbow hues, drawn from styles/tokens.css signal/accent
// tokens so quick picks match the rest of the chrome. The token set has no
// pure yellow, so #E8C547 is a harmonious fill between warn-amber and run-green.
export const RAINBOW_PRESETS = [
    '#D63838', // red    — --sig-fault
    '#E89E1A', // orange — --sig-warn
    '#E8C547', // yellow
    '#0EA968', // green  — --sig-run
    '#1F77E0', // blue   — --sig-info
    '#1F4DE5', // indigo — --accent
    '#8B5CF6', // violet — --sig-queued
];

interface ColorCellProps {
    onChange: (e: {dataItem: any; field: string; value: string}) => void;
    dataItem: any;
    field: string;
    value?: string;
    inEdit?: boolean;
    editable?: boolean;
    /** Quick-pick swatches; defaults to the app rainbow. */
    presets?: string[];
}

const swatch = (color: string, size = 14): CSSProperties => ({
    width: size,
    height: size,
    borderRadius: 3,
    background: color,
    border: '1px solid rgba(0,0,0,0.2)',
    boxSizing: 'border-box',
});

export const ColorCell = ({
    editable = true,
    presets = RAINBOW_PRESETS,
    ...props
}: ColorCellProps) => {
    const {dataItem, field, inEdit, value} = props;
    const current = (value ?? dataItem?.[field]) as string | undefined;

    const set = (hex: string) => props.onChange({dataItem, field, value: hex});

    // New row: no color yet → seed the first preset so the POST body always
    // carries a value (the column is NOT NULL on the backend).
    useEffect(() => {
        if (inEdit && editable && !current) {
            set(presets[0]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inEdit, editable, current]);

    if (inEdit && editable) {
        return (
            <Box sx={{display: 'flex', alignItems: 'center', gap: '4px', width: '100%', py: 0.5}}>
                {presets.map((c) => (
                    <button
                        key={c}
                        type="button"
                        title={c}
                        onClick={() => set(c)}
                        style={{
                            ...swatch(c, 16),
                            padding: 0,
                            cursor: 'pointer',
                            outline:
                                current?.toLowerCase() === c.toLowerCase()
                                    ? '2px solid var(--ink-1)'
                                    : 'none',
                            outlineOffset: 1,
                        }}
                    />
                ))}
                <input
                    type="color"
                    value={current || presets[0]}
                    onChange={(e) => set(e.target.value)}
                    title="Custom color"
                    style={{
                        width: 22,
                        height: 22,
                        padding: 0,
                        border: '1px solid var(--line)',
                        borderRadius: 3,
                        background: 'none',
                        cursor: 'pointer',
                    }}
                />
            </Box>
        );
    }

    if (!current) {
        return <Box sx={{color: 'var(--ink-4)'}}>—</Box>;
    }

    return (
        <Box sx={{display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ink-2)'}}>
            <span style={swatch(current)} />
            <span>{current}</span>
        </Box>
    );
};
