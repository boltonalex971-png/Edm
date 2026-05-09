import { createTheme } from '@mui/material/styles'

// Maps Direction A · Steel tokens (tokens.css) into a MUI theme so MUI
// primitives render in the same visual language as the rest of the plugin.
// Hex literals are kept in sync with tokens.css; everything beyond the
// initial palette wiring should reference CSS variables via theme overrides.
export const theme = createTheme({
    palette: {
        mode: 'light',
        primary: { main: '#1F4DE5', dark: '#36488A', light: '#DEE3F2' },
        text: { primary: '#0E1620', secondary: '#5A6472', disabled: '#B5BCC6' },
        background: { default: '#EEF0F3', paper: '#FFFFFF' },
        divider: '#DCE0E6',
        error: { main: '#D63838', dark: '#8A1818', light: '#FCE3E3' },
        warning: { main: '#E89E1A', dark: '#8A5C03', light: '#FCEFD2' },
        success: { main: '#0EA968', dark: '#06673F', light: '#DFF6E9' },
        info: { main: '#1F77E0', light: '#DCEAFB' },
    },
    typography: {
        fontFamily: '"Archivo", system-ui, -apple-system, "Segoe UI", sans-serif',
        h1: { fontSize: 40, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.05 },
        h2: { fontSize: 28, fontWeight: 700, letterSpacing: '-0.01em' },
        h3: { fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em' },
        h4: { fontSize: 18, fontWeight: 700, letterSpacing: '-0.005em' },
        h5: { fontSize: 16, fontWeight: 700, letterSpacing: '-0.005em' },
        h6: { fontSize: 14, fontWeight: 700, letterSpacing: '-0.005em' },
        body1: { fontSize: 14 },
        body2: { fontSize: 13 },
        caption: { fontSize: 11.5, color: 'var(--ink-3)' },
        button: { textTransform: 'none', fontWeight: 600 },
    },
    shape: { borderRadius: 4 },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: { fontFeatureSettings: '"ss01", "cv11"' },
            },
        },
        MuiButton: {
            defaultProps: { disableElevation: true },
            styleOverrides: {
                root: {
                    height: 'var(--btn-h)',
                    borderRadius: 'var(--r-2)',
                    fontWeight: 600,
                    textTransform: 'none',
                    letterSpacing: 0,
                },
                containedPrimary: {
                    background: 'var(--accent)',
                    color: 'var(--accent-fg)',
                    '&:hover': { background: 'var(--accent-deep)' },
                },
                outlined: {
                    borderColor: 'var(--line-strong)',
                    color: 'var(--ink-1)',
                    '&:hover': { borderColor: 'var(--ink-3)', background: 'var(--surface-2)' },
                },
                text: {
                    color: 'var(--ink-2)',
                    '&:hover': { background: 'var(--surface-3)' },
                },
            },
        },
        MuiIconButton: {
            styleOverrides: {
                root: {
                    color: 'var(--ink-2)',
                    '&:hover': { background: 'var(--surface-2)' },
                },
            },
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    borderRadius: 'var(--r-2)',
                    background: 'var(--surface)',
                    /* Honor density (--field-h cascades from .density-* on
                       .page-root). minHeight so size="small" instances
                       still fit; touch grows 36 → 52, compact stays 30. */
                    minHeight: 'var(--field-h)',
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--ink-3)' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'var(--accent)',
                        borderWidth: 1,
                        boxShadow: '0 0 0 3px var(--accent-soft)',
                    },
                },
                notchedOutline: { borderColor: 'var(--line-strong)' },
            },
        },
        MuiInputLabel: {
            styleOverrides: {
                root: {
                    color: 'var(--ink-3)',
                    '&.Mui-focused': { color: 'var(--accent)' },
                },
            },
        },
        MuiTabs: {
            styleOverrides: {
                root: {
                    borderBottom: '1px solid var(--line)',
                    minHeight: 40,
                },
                indicator: {
                    backgroundColor: 'var(--accent)',
                    height: 2,
                },
            },
        },
        MuiTab: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 500,
                    fontSize: 13,
                    color: 'var(--ink-3)',
                    minHeight: 36,
                    padding: '10px 14px',
                    '&.Mui-selected': { color: 'var(--ink-1)', fontWeight: 700 },
                    '&:hover': { color: 'var(--ink-1)' },
                },
            },
        },
        MuiPaper: {
            defaultProps: { elevation: 0 },
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    borderColor: 'var(--line)',
                },
            },
        },
        MuiAppBar: {
            defaultProps: { elevation: 0, color: 'inherit' },
            styleOverrides: {
                root: {
                    backgroundColor: 'var(--surface)',
                    color: 'var(--ink-1)',
                    borderBottom: '1px solid var(--line)',
                    boxShadow: 'none',
                },
            },
        },
        MuiToolbar: {
            styleOverrides: {
                root: { minHeight: 56 },
            },
        },
        MuiDialog: {
            styleOverrides: {
                paper: {
                    borderRadius: 'var(--r-2)',
                    border: '1px solid var(--line)',
                    boxShadow: 'var(--elev-3)',
                },
            },
        },
        MuiDialogTitle: {
            styleOverrides: {
                root: {
                    fontSize: 16,
                    fontWeight: 700,
                    color: 'var(--ink-1)',
                    borderBottom: '1px solid var(--line)',
                    padding: '14px 20px',
                },
            },
        },
        MuiAlert: {
            styleOverrides: {
                // HANDOFF · platform.html 04e.7 · 4px left rail per severity.
                root: { borderRadius: 'var(--r-2)', borderLeftWidth: 4, borderLeftStyle: 'solid' },
                standardError: {
                    background: 'var(--sig-fault-soft)',
                    color: 'var(--sig-fault-deep)',
                    borderLeftColor: 'var(--sig-fault)',
                },
                standardWarning: {
                    background: 'var(--sig-warn-soft)',
                    color: 'var(--sig-warn-deep)',
                    borderLeftColor: 'var(--sig-warn)',
                },
                standardSuccess: {
                    background: 'var(--sig-run-soft)',
                    color: 'var(--sig-run-deep)',
                    borderLeftColor: 'var(--sig-run)',
                },
                standardInfo: {
                    background: 'var(--sig-info-soft)',
                    color: 'var(--sig-info)',
                    borderLeftColor: 'var(--sig-info)',
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    border: '1px solid var(--line-strong)',
                    background: 'var(--surface)',
                    color: 'var(--ink-2)',
                    height: 22,
                },
                outlined: {
                    background: 'transparent',
                },
            },
        },
        MuiBreadcrumbs: {
            styleOverrides: {
                root: {
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10.5,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--ink-3)',
                },
                separator: { color: 'var(--ink-4)', marginLeft: 4, marginRight: 4 },
            },
        },
        MuiDivider: {
            styleOverrides: {
                root: { borderColor: 'var(--line)' },
            },
        },
        MuiMenu: {
            styleOverrides: {
                paper: {
                    border: '1px solid var(--line)',
                    boxShadow: 'var(--elev-popover)',
                    borderRadius: 'var(--r-2)',
                },
            },
        },
        MuiMenuItem: {
            styleOverrides: {
                root: {
                    fontSize: 13,
                    color: 'var(--ink-2)',
                    '&:hover': { background: 'var(--surface-2)' },
                    '&.Mui-selected': {
                        background: 'var(--accent-tint)',
                        color: 'var(--ink-1)',
                        '&:hover': { background: 'var(--accent-tint)' },
                    },
                },
            },
        },
        MuiBadge: {
            styleOverrides: {
                badge: {
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    fontWeight: 700,
                },
            },
        },
        // HANDOFF · v2 04c.2 production data table. DataGrid slots are
        // restyled to match the v2 .s-row / .row family + sortable header
        // arrow + active-sort accent tint + checkbox + v2 pagination foot.
        // RelationTable is a thin pass-through so all visual rules live here.
        MuiDataGrid: {
            styleOverrides: {
                root: {
                    border: '1px solid var(--line)',
                    borderRadius: 'var(--r-2)',
                    background: 'var(--surface)',
                    fontSize: 13,
                    color: 'var(--ink-2)',
                    '--DataGrid-rowBorderColor': 'var(--line-soft)',
                    '--DataGrid-containerBackground': 'var(--surface-2)',
                },
                columnHeader: {
                    background: 'var(--surface-2)',
                    color: 'var(--ink-3)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10.5,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    fontWeight: 600,
                    /* Active-sort tint per v2 04c.2 — header text + arrow
                       lift to accent-deep so the user sees which column
                       is driving the order. */
                    '&[aria-sort]:not([aria-sort="none"])': {
                        color: 'var(--accent-deep)',
                        background: 'var(--accent-tint)',
                    },
                    '& .MuiDataGrid-iconButtonContainer .MuiSvgIcon-root': {
                        fontSize: 16,
                    },
                    '& .MuiDataGrid-sortIcon': {
                        color: 'var(--accent-deep)',
                        opacity: 0.85,
                    },
                },
                columnHeaders: {
                    borderBottom: '1px solid var(--line)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 2,
                },
                columnHeaderTitle: { fontWeight: 600 },
                row: {
                    /* Density-driven row height. DataGrid sets row height
                       inline via virtualizer style on the row's wrapper, so
                       we override the cell min-height instead — see `cell`
                       below. The hover/selected/editing rules continue to
                       cover the row regardless of height. */
                    '&:hover': { background: 'var(--surface-2)' },
                    '&.Mui-selected': {
                        background: 'var(--accent-tint)',
                        boxShadow: 'inset 3px 0 0 var(--accent)',
                        '&:hover': { background: 'var(--accent-tint)' },
                    },
                    /* Row-edit signal: darken the whole row with the
                       accent-soft wash. No border, no per-cell ring —
                       contrast against the editing cells (which stay on
                       --surface) does the work of showing what's
                       editable inside it. */
                    '&.MuiDataGrid-row--editing': {
                        background: 'var(--accent-soft)',
                        '&:hover': { background: 'var(--accent-soft)' },
                    },
                },
                cell: {
                    borderBottom: '1px solid var(--line-soft)',
                    color: 'var(--ink-2)',
                    '&:focus, &:focus-within': { outline: 'none' },
                    /* Editing cell — clean transparent surface; the
                       MUI input controls inside (TextField / Select /
                       Autocomplete) carry their own outlined border via
                       MuiOutlinedInput, so we don't double-frame them. */
                    '&.MuiDataGrid-cell--editing': {
                        background: 'transparent',
                        boxShadow: 'none',
                        padding: '0 6px',
                    },
                    '& .MuiDataGrid-editInputCell input': {
                        font: 'inherit',
                        padding: '0 4px',
                    },
                },
                /* Multi-select checkbox column — accent-tinted when checked,
                   indeterminate header state inherits from MuiCheckbox. */
                checkboxInput: {
                    color: 'var(--ink-3)',
                    '&.Mui-checked, &.MuiCheckbox-indeterminate': {
                        color: 'var(--accent)',
                    },
                },
                footerContainer: {
                    borderTop: '1px solid var(--line)',
                    background: 'var(--surface-2)',
                    color: 'var(--ink-3)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    minHeight: 36,
                    letterSpacing: '0.04em',
                },
                selectedRowCount: {
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: 'var(--accent-deep)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                },
                /* Pagination labels — mono uppercase to match the
                   `.row.head` family. */
                root2: {},
            },
        },
        MuiTablePagination: {
            styleOverrides: {
                root: {
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: 'var(--ink-3)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                },
                selectLabel: { fontFamily: 'inherit', fontSize: 'inherit' },
                displayedRows: { fontFamily: 'inherit', fontSize: 'inherit' },
            },
        },
    },
})
