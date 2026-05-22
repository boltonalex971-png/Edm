import {
    getCurrentSender,
    useSignalR as packageUseSignalR,
} from '@microprojects/edm-components/hooks'
import type { LogisticsMessage } from './logisticsEvents'

// Logistics's typed publisher. Wraps the package's currentSender so
// callers anywhere in the SPA can publish a discriminated-union
// LogisticsMessage without each holding its own hub connection.
// Mistyping a kind or missing a payload field is a compile-time error.
export function publishLogisticsMessage(message: LogisticsMessage): void {
    const sender = getCurrentSender()
    if (!sender) return
    sender('Publish', 'Logistics', message).catch(() => {
        // Best-effort: hub-down or transient failures are swallowed so the
        // caller's UI flow is never blocked by transport issues.
    })
}

// Re-export the package primitives so existing import sites
// (./signalRHooks) keep working without churn.
export { getCurrentConnectionId } from '@microprojects/edm-components/hooks'
export { packageUseSignalR as default }
