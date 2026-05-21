import '@logistics/components/orders' // side-effect: registers the `orders` namespace
import { AllocateProcessOutput } from '@logistics/components/orders/AllocateProcessOutput'
import type { UUID } from '@logistics/data/types'
import { CloseOutlined as CloseIcon } from '@mui/icons-material'
import {
    Box,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
} from '@mui/material'
import { useTranslation } from 'react-i18next'

type AllocateOutputWindowProps = {
    orderId: UUID
    onClose: () => void
    onChanged?: () => void
}

export function AllocateOutputWindow({
    orderId,
    onClose,
    onChanged,
}: AllocateOutputWindowProps) {
    const { t } = useTranslation('orders')
    return (
        <Dialog
            open
            fullWidth
            maxWidth={false}
            onClose={onClose}
            PaperProps={{
                sx: {
                    width: '90vw',
                    height: '90vh',
                    maxHeight: '90vh',
                    m: 0,
                    borderRadius: 'var(--r-2)',
                    background: 'var(--surface)',
                    border: '1px solid var(--line-strong)',
                    boxShadow: 'var(--elev-3)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                },
            }}
        >
            <DialogTitle
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    py: 1,
                    px: 1.5,
                    background: 'var(--surface-2)',
                    borderBottom: '1px solid var(--line)',
                    fontSize: 14,
                    fontWeight: 700,
                    color: 'var(--ink-1)',
                }}
            >
                <Box sx={{ flex: 1 }}>{t('allocate.title', 'Allocate process output')}</Box>
                <IconButton
                    size="small"
                    onClick={onClose}
                    sx={{ color: 'var(--ink-3)' }}
                >
                    <CloseIcon fontSize="small" />
                </IconButton>
            </DialogTitle>
            <DialogContent
                sx={{
                    flex: 1,
                    minHeight: 0,
                    p: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                }}
            >
                <AllocateProcessOutput
                    orderId={orderId}
                    onClose={onClose}
                    onChanged={onChanged}
                />
            </DialogContent>
        </Dialog>
    )
}
