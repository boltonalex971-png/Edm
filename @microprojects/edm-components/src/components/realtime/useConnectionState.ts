import {useEffect, useState} from 'react';
import {HubConnection, HubConnectionBuilder, LogLevel} from '@microsoft/signalr';
import {getCookie} from '../../hooks/getCookie';

// HANDOFF · v2 chrome.html 04f.4 · connection pip.
// Drives the top-bar pip from a real SignalR lifecycle. Five states
// match the v2 .tb-pip CSS modifiers (default / .connecting /
// .reconnecting / .disconnected / .stale).

export type ConnectionStatus =
    | 'connecting'
    | 'connected'
    | 'reconnecting'
    | 'disconnected'
    | 'stale';

export interface ConnectionState {
    status: ConnectionStatus;
    lastSeen: Date | null;
}

export interface UseConnectionStateOptions {
    /** Override the access-token source (default: read `X-Auth-Token` cookie). */
    getToken?: () => string | null | undefined | Promise<string | null | undefined>;
    /** Idle threshold in ms before flipping to 'stale' even when connected. Default 60_000. */
    staleAfterMs?: number;
}

const DEFAULT_STALE_AFTER_MS = 60_000;

export function useConnectionState(hubUrl: string, options?: UseConnectionStateOptions): ConnectionState {
    const [status, setStatus] = useState<ConnectionStatus>('connecting');
    const [lastSeen, setLastSeen] = useState<Date | null>(null);
    const staleAfterMs = options?.staleAfterMs ?? DEFAULT_STALE_AFTER_MS;

    useEffect(() => {
        let stopped = false;
        const tokenFactory = options?.getToken ?? (() => getCookie('X-Auth-Token'));
        const conn: HubConnection = new HubConnectionBuilder()
            .withUrl(hubUrl, {
                withCredentials: false,
                accessTokenFactory: async () => {
                    const t = await tokenFactory();
                    return t ?? '';
                },
            })
            .withAutomaticReconnect()
            .configureLogging(LogLevel.Error)
            .build();

        conn.onreconnecting(() => {
            if (!stopped) setStatus('reconnecting');
        });
        conn.onreconnected(() => {
            if (stopped) return;
            setStatus('connected');
            setLastSeen(new Date());
        });
        conn.onclose(() => {
            if (!stopped) setStatus('disconnected');
        });

        setStatus('connecting');
        conn.start()
            .then(() => {
                if (stopped) return;
                setStatus('connected');
                setLastSeen(new Date());
            })
            .catch(() => {
                if (!stopped) setStatus('disconnected');
            });

        return () => {
            stopped = true;
            conn.stop();
        };
    }, [hubUrl]);

    /* Stale-watch: even when SignalR claims connected, fall back to
       'stale' after staleAfterMs without any confirmed activity. */
    useEffect(() => {
        if (status !== 'connected' || !lastSeen) return;
        const t = window.setTimeout(() => setStatus('stale'), staleAfterMs);
        return () => window.clearTimeout(t);
    }, [status, lastSeen, staleAfterMs]);

    return {status, lastSeen};
}

/* Maps a status into the v2 .tb-pip slot props (kind class + label). */
export const STATUS_TO_PIP: Record<ConnectionStatus, {kind: string; label: string}> = {
    connecting:   {kind: 'connecting',   label: 'Connecting'},
    connected:    {kind: 'connected',    label: 'Live'},
    reconnecting: {kind: 'reconnecting', label: 'Reconnecting'},
    disconnected: {kind: 'disconnected', label: 'Offline'},
    stale:        {kind: 'stale',        label: 'Stale'},
};
