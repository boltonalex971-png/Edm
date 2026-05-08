import { Box, Chip, Stack, Typography } from '@mui/material'

interface FooterProps {
    productVersion: string
}

// Sticky footer mirroring Hub's: copyright on the left, outlined version chip
// on the right. Keeps Console's bottom edge visually identical to Hub's so
// the two plugins frame the same way.
export function Footer({ productVersion }: FooterProps) {
    const currentYear = new Date().getFullYear()
    return (
        <Box component="footer" className="page-footer">
            <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                justifyContent="space-between"
                sx={{ width: '100%' }}
            >
                <Typography
                    variant="caption"
                    sx={{ color: 'var(--ink-3)', fontWeight: 500 }}
                >
                    &copy; Microprojects 2020 &ndash; {currentYear}
                </Typography>
                <Chip
                    label={`EDM ${productVersion || '—'}`}
                    size="small"
                    variant="outlined"
                    className="version-chip"
                />
            </Stack>
        </Box>
    )
}
