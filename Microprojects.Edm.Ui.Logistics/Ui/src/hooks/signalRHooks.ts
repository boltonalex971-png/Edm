import {
    type HubConnection,
    HubConnectionBuilder,
    LogLevel,
} from '@microsoft/signalr'
import { useEffect, useState } from 'react'
import type { LogisticsMessage } from './logisticsEvents'

export function getCookie(name: string): string | undefined {
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) {
        return parts.pop()?.split(';').shift()
    }
    return undefined
}

// Module-scope mirror of the latest hub connection id. The axios request
// interceptor reads this to stamp X-Edm-Connection-Id on every API call so
// the server can echo it back in published LogisticsMessages and the bridge
// can suppress self-echo. Null until the hub connects.
let currentConnectionId: string | null = null

export function getCurrentConnectionId(): string | null {
    return currentConnectionId
}

// Module-scope sender, populated by the active useSignalR instance. Lets
// arbitrary components publish to the Logistics channel without each
// holding its own hub connection.
type Sender = (methodName: string, ...args: any[]) => Promise<void>
let currentSender: Sender | null = null

// Typed publish: callers pass a discriminated-union message built by the
// helpers in logisticsEvents.ts. Mistyping a kind or missing a payload
// field is a compile-time error.
export function publishLogisticsMessage(message: LogisticsMessage): void {
    if (!currentSender) return
    currentSender('Publish', 'Logistics', message).catch(() => {
        // Best-effort: hub-down or transient failures are swallowed so the
        // caller's UI flow is never blocked by transport issues.
    })
}

type UseSignalRResult = {
    error: unknown
    sendMessage: (methodName: string, ...args: any[]) => Promise<void>
    connectionId: string | null
}

export default function useSignalR(
    hubUrl: string,
    channel: string,
    callback: (...args: any[]) => void,
): UseSignalRResult {
    const [connection, setConnection] = useState<HubConnection | undefined>()
    const [isConnected, setIsConnected] = useState(false)
    const [connectionId, setConnectionId] = useState<string | null>(null)
    const [error, setError] = useState<unknown>(null)

    useEffect(() => {
        const token = getCookie('X-Auth-Token')
        const newConnection = new HubConnectionBuilder()
            .withUrl(hubUrl, {
                withCredentials: false,
                accessTokenFactory: () => token ?? '',
            })
            .withAutomaticReconnect()
            .configureLogging(LogLevel.Error)
            .build()

        setConnection(newConnection)

        return () => {
            newConnection.stop().catch(() => {})
        }
    }, [hubUrl])

    useEffect(() => {
        if (!connection) return
        connection
            .start()
            .then(() => {
                setIsConnected(true)
                setError(null)
                currentConnectionId = connection.connectionId ?? null
                setConnectionId(currentConnectionId)
                connection.invoke('Subscribe', channel).catch((e) => setError(e))
            })
            .catch((e) => {
                setError(e)
                setIsConnected(false)
            })

        connection.onclose(() => {
            setIsConnected(false)
            currentConnectionId = null
            setConnectionId(null)
        })
        connection.onreconnected((id) => {
            setIsConnected(true)
            currentConnectionId = id ?? null
            setConnectionId(currentConnectionId)
            // Re-subscribe after reconnect — group memberships do not survive
            // a reconnect on the server side.
            connection.invoke('Subscribe', channel).catch((e) => setError(e))
        })
    }, [connection, channel])

    useEffect(() => {
        if (!connection || !isConnected) return
        connection.on('Receive', callback)
        return () => {
            connection.off('Receive', callback)
        }
    }, [connection, isConnected, callback])

    const sendMessage = async (methodName: string, ...args: any[]) => {
        if (connection && isConnected) {
            try {
                await connection.invoke(methodName, ...args)
            } catch (e) {
                console.error('Error invoking SignalR method:', e)
            }
        } else {
            console.warn('Cannot send message: SignalR not connected.')
        }
    }

    useEffect(() => {
        currentSender = isConnected ? sendMessage : null
        return () => {
            if (currentSender === sendMessage) currentSender = null
        }
    }, [isConnected])

    return { error, sendMessage, connectionId }
}
