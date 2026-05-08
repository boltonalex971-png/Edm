import { createTheme } from '@mui/material/styles'

// Maps Direction A · Steel tokens (tokens.css) into a MUI theme so MUI
// primitives render in the same visual language as the rest of the
// landing page. Hex values are kept in sync with tokens.css.
export const theme = createTheme({
    palette: {
        mode: 'light',
        primary:   { main: '#1F4DE5', dark: '#1838AB', light: '#E1E8FF' },
        text:      { primary: '#0E1620', secondary: '#5A6472', disabled: '#B5BCC6' },
        background:{ default: '#EEF0F3', paper: '#FFFFFF' },
        divider:   '#DCE0E6',
    },
    typography: {
        fontFamily:
            '"Archivo", system-ui, -apple-system, "Segoe UI", sans-serif',
        h1: { fontSize: 88, fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 0.92 },
        h2: { fontSize: 32, fontWeight: 700, letterSpacing: '-0.01em' },
        h3: { fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em' },
        body1: { fontSize: 14 },
        button: { textTransform: 'none', fontWeight: 500 },
    },
    shape: {
        borderRadius: 4,
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    fontFeatureSettings: '"ss01", "cv11"',
                },
            },
        },
    },
})
