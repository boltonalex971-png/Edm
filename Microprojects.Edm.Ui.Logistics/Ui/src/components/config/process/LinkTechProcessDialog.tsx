import type { UUID } from '@logistics/data/types'
import { useGet } from '@microprojects/edm-components/hooks'
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography,
} from '@mui/material'
import axios from 'axios'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Api from '../../../features/api/api'
import './index' // side-effect: registers the `config/process` namespace

type TechProcessSummary = {
    id: UUID
    name: string
    description?: string
    operationGuid: UUID
    isCellAware: boolean
}

type LinkTechProcessDialogProps = {
    open: boolean
    technologyProcessId: UUID
    onClose: () => void
    onLinked: () => void
}

export function LinkTechProcessDialog({
    open,
    technologyProcessId,
    onClose,
    onLinked,
}: LinkTechProcessDialogProps) {
    const { t } = useTranslation('config/process')
    const [[processes]] = useGet<TechProcessSummary[]>(
        `${Api.techlink}/processes`,
        [],
    )
    const [selectedId, setSelectedId] = useState<UUID | ''>('')
    const [mode, setMode] = useState<string>('')
    const [order, setOrder] = useState<number>(1)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string>('')

    const selected = (processes ?? []).find((p) => p.id === selectedId)
    const perCellDisabled = !selected?.isCellAware

    const link = async () => {
        if (!selectedId) return
        setSaving(true)
        setError('')
        try {
            await axios.post(
                `${Api.techlink}/processes/${technologyProcessId}/link`,
                {
                    techProcessId: selectedId,
                    mode: mode || null,
                    order: Number(order) || 0,
                },
            )
            onLinked()
            onClose()
        } catch (e: any) {
            setError(
                e?.response?.data?.detail ||
                    e?.response?.data?.title ||
                    e?.message ||
                    t('linkTech.error'),
            )
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>{t('linkTech.title')}</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                    <FormControl fullWidth size="small">
                        <InputLabel>{t('linkTech.process')}</InputLabel>
                        <Select
                            label={t('linkTech.process')}
                            value={selectedId}
                            onChange={(e) => {
                                setSelectedId(e.target.value as UUID)
                                // Reset PerCell if the new process is not cell-aware.
                                const next = (processes ?? []).find(
                                    (p) => p.id === e.target.value,
                                )
                                if (mode === 'PerCell' && !next?.isCellAware) {
                                    setMode('')
                                }
                            }}
                        >
                            {(processes ?? []).map((p) => (
                                <MenuItem key={p.id} value={p.id}>
                                    {p.name}
                                    {p.isCellAware ? '' : ` ${t('linkTech.notCellAware')}`}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth size="small">
                        <InputLabel>{t('field.mode')}</InputLabel>
                        <Select
                            label={t('field.mode')}
                            value={mode}
                            onChange={(e) => setMode(e.target.value)}
                        >
                            <MenuItem value="">
                                <em>{t('field.modeUnset')}</em>
                            </MenuItem>
                            <MenuItem value="PerCell" disabled={perCellDisabled}>
                                {t('field.modePerCell')}
                                {perCellDisabled
                                    ? ` ${t('linkTech.perCellUnavailable')}`
                                    : ''}
                            </MenuItem>
                            <MenuItem value="SingleCell">
                                {t('field.modeSingleCell')}
                            </MenuItem>
                            <MenuItem value="Global">
                                {t('field.modeGlobal')}
                            </MenuItem>
                        </Select>
                    </FormControl>

                    <TextField
                        size="small"
                        type="number"
                        label={t('subprocesses.order')}
                        value={order}
                        onChange={(e) => setOrder(Number(e.target.value))}
                        sx={{ maxWidth: 160 }}
                    />

                    {error && (
                        <Typography variant="caption" sx={{ color: 'var(--danger, #d32f2f)' }}>
                            {error}
                        </Typography>
                    )}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={saving}>
                    {t('linkTech.cancel')}
                </Button>
                <Button
                    variant="contained"
                    onClick={link}
                    disabled={!selectedId || saving}
                >
                    {t('linkTech.link')}
                </Button>
            </DialogActions>
        </Dialog>
    )
}
