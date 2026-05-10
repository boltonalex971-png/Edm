// Phase 3b — InlineAlert is replaced by the package's ToastProvider/useToast.
// This file now exposes:
//   * `AlertState` type — kept so existing prop contracts that pass a
//     `setAlert(AlertState)` callback don't have to be reshaped.
//   * `useAlertSetter()` hook — drop-in replacement for the old
//     `useState<AlertState>()` setter; routes status → toast severity.
//   * `InlineAlert` no-op stub — render nothing; the Snackbar lives at
//     app root via <ToastProvider position="top-right"> in index.tsx.
//     The stub stays until Phase 3c cleanup removes the JSX call sites.

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

/** Legacy no-op stub — kept so straggler JSX doesn't crash before Phase 3c
 *  removes the call sites. Do not use in new code; call useAlertSetter()
 *  or useToast() directly instead. */
export const InlineAlert = (_props: {
    id?: unknown
    state?: AlertState
    onClose?: () => void
}) => null
