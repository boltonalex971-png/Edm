import { useCallback } from 'react'
import { useToast } from '@microprojects/edm-components/components/states/Toast'

export type AlertState = {
    message: string
    status?: 'warning' | 'danger' | undefined
}

export function useAlertSetter(): (state: AlertState | undefined) => void {
    const toast = useToast()
    return useCallback(
        (state) => {
            if (!state) return // legacy "clear" — Snackbar auto-dismisses, no-op
            if (state.status === 'danger') toast.error(state.message)
            else if (state.status === 'warning') toast.warning(state.message)
            else toast.success(state.message)
        },
        [toast],
    )
}
