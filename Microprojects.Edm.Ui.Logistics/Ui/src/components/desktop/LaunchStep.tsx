import api from '@features/api/api.ts'
import { ComponentLookup } from '@logistics/components/desktop/ComponentLookup'
import type {
    AllocateItemsResult,
    OrderSpecification,
    UUID,
} from '@logistics/data/types'
import { getData } from '@logistics/hooks/hooks'
import { formatUnits } from '@logistics/utils/format'
import {
    Alert,
    Box,
    Button as MuiButton,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material'
import { useCallback, useEffect, useState } from 'react'

type LaunchStepProps = {
    orderId: UUID
    onLaunch: () => void
    launching: boolean
    launchError?: string
    readOnly: boolean
    /** When true the order is no longer at the Launch step — hide Launch and
     * the lookup affordance; show inputs as a read-only summary. */
    reviewOnly?: boolean
    /** Provided when reviewOnly: button to return to the live step. */
    onResume?: () => void
}

const EPS = 1e-9

export const LaunchStep = ({
    orderId,
    onLaunch,
    launching,
    launchError,
    readOnly,
    reviewOnly,
    onResume,
}: LaunchStepProps) => {
    const locked = readOnly || reviewOnly === true

    const [specs, setSpecs] = useState<OrderSpecification[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | undefined>()
    const [info, setInfo] = useState<string | undefined>()
    const [pickFor, setPickFor] = useState<OrderSpecification | undefined>()

    const reload = useCallback(async () => {
        setError(undefined)
        try {
            const data = await getData<OrderSpecification[]>(
                `${api.orders}/${orderId}/specification`,
            )
            setSpecs(data ?? [])
        } catch (e) {
            setError(
                (e as { message?: string })?.message ||
                    'Failed to load specifications',
            )
        } finally {
            setLoading(false)
        }
    }, [orderId])

    useEffect(() => {
        void reload()
    }, [reload])

    const onAllocated = (result?: AllocateItemsResult) => {
        if (result) {
            const qtyTxt = formatUnits(
                result.allocatedQuantity,
                result.units,
                result.countable,
            )
            setInfo(
                `Added ${qtyTxt}` +
                    (result.stoppedReason
                        ? ` (stopped: ${result.stoppedReason})`
                        : ''),
            )
        }
        void reload()
    }

    const allComplete =
        specs.length > 0 && specs.every((s) => s.total + EPS >= s.amount)
    const launchDisabled = locked || launching || !allComplete

    return (
        <Box>
            {!locked && specs.length > 0 && (
                <Typography
                    variant="caption"
                    sx={{
                        color: 'var(--ink-3)',
                        fontSize: 13,
                        display: 'block',
                        mb: 1,
                    }}
                >
                    {info ??
                        'Click a row to pick available items for that nomenclature.'}
                </Typography>
            )}

            {error && (
                <Alert severity="error" sx={{ mb: 1 }}>
                    {error}
                </Alert>
            )}

            {loading && (
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        color: 'var(--ink-3)',
                        py: 1,
                    }}
                >
                    <CircularProgress size={14} />
                    <Typography variant="caption">Loading…</Typography>
                </Box>
            )}
            {!loading && specs.length === 0 && (
                <Box
                    sx={{
                        py: 2,
                        color: 'var(--ink-3)',
                        fontStyle: 'italic',
                        fontSize: 14,
                    }}
                >
                    No input specifications for this process — ready to launch.
                </Box>
            )}
            {specs.length > 0 && (
                <Table size="small" sx={{ mb: 1.5 }}>
                    <TableHead>
                        <TableRow>
                            <TableCell
                                sx={{
                                    color: 'var(--ink-3)',
                                    fontWeight: 700,
                                    borderBottom: '2px solid var(--line-strong)',
                                }}
                            >
                                Nomenclature
                            </TableCell>
                            <TableCell
                                sx={{
                                    color: 'var(--ink-3)',
                                    fontWeight: 700,
                                    borderBottom: '2px solid var(--line-strong)',
                                }}
                            >
                                Required
                            </TableCell>
                            <TableCell
                                sx={{
                                    color: 'var(--ink-3)',
                                    fontWeight: 700,
                                    borderBottom: '2px solid var(--line-strong)',
                                }}
                            >
                                Allocated
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {specs.map((spec) => {
                            const ok = spec.total + EPS >= spec.amount
                            const clickable = !locked && !ok
                            return (
                                <TableRow
                                    key={spec.id}
                                    hover={clickable}
                                    onClick={
                                        clickable
                                            ? () => setPickFor(spec)
                                            : undefined
                                    }
                                    title={
                                        clickable ? 'Click to pick items' : undefined
                                    }
                                    sx={{
                                        cursor: clickable ? 'pointer' : 'default',
                                        ...(ok && {
                                            background: 'var(--sig-run-soft)',
                                        }),
                                    }}
                                >
                                    <TableCell>
                                        <Box sx={{ fontWeight: 500 }}>
                                            {spec.nomenclatureName ?? '—'}
                                        </Box>
                                        {spec.nomenclatureCategory && (
                                            <Box
                                                sx={{
                                                    fontSize: 12,
                                                    color: 'var(--ink-3)',
                                                }}
                                            >
                                                {spec.nomenclatureCategory}
                                            </Box>
                                        )}
                                    </TableCell>
                                    <TableCell>{spec.amount}</TableCell>
                                    <TableCell>
                                        <Box
                                            component="span"
                                            sx={{
                                                display: 'inline-block',
                                                minWidth: 90,
                                                fontWeight: 700,
                                                color: ok
                                                    ? 'var(--sig-run-deep)'
                                                    : 'var(--sig-fault-deep)',
                                            }}
                                        >
                                            {spec.total} / {spec.amount}
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            )}

            {launchError && (
                <Alert severity="error" sx={{ mb: 1 }}>
                    {launchError}
                </Alert>
            )}

            <Box
                sx={{
                    mt: 2,
                    pt: 2,
                    borderTop: '1px solid var(--line)',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 1,
                }}
            >
                {reviewOnly && onResume ? (
                    <MuiButton
                        variant="contained"
                        color="primary"
                        size="large"
                        onClick={onResume}
                        sx={{ minWidth: 180 }}
                    >
                        Resume
                    </MuiButton>
                ) : (
                    <MuiButton
                        variant="contained"
                        color="primary"
                        size="large"
                        onClick={onLaunch}
                        disabled={launchDisabled}
                        title={
                            readOnly
                                ? 'Read-only'
                                : !allComplete
                                  ? 'All inputs must be allocated before launch'
                                  : undefined
                        }
                        sx={{ minWidth: 180 }}
                    >
                        {readOnly
                            ? 'Read-only'
                            : launching
                              ? 'Launching…'
                              : 'Launch'}
                    </MuiButton>
                )}
            </Box>

            {pickFor && (
                <ComponentLookup
                    orderId={orderId}
                    spec={pickFor}
                    onClose={() => setPickFor(undefined)}
                    onAllocated={onAllocated}
                />
            )}
        </Box>
    )
}
