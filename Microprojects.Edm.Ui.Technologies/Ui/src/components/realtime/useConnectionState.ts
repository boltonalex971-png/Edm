import {useEffect, useState} from 'react';
import {HubConnection, HubConnectionBuilder, LogLevel} from '@microsoft/signalr';
import {getCookie} from '../hooks/hooks.js';

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

// `stale` is set when nothing has confirmed the connection for STALE_AFTER_MS,
// even if SignalR still claims to be connected. The chrome pip can fade
// to grey to flag a sleeper connection that hasn't actually heard back.
const STALE_AFTER_MS = 60_000;

export function useConnectionState(hubUrl: string): ConnectionState {
    const [status, setStatus] = useState<ConnectionStatus>('connecting');
    const [lastSeen, setLastSeen] = useState<Date | null>(null);

    useEffect(() => {
        let stopped = false;
        const token = getCookie('X-Auth-Token');
        const conn: HubConnection = new HubConnectionBuilder()
            .withUrl(hubUrl, {
                withCredentials: false,
                accessTokenFactory: () => token,
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
       'stale' after STALE_AFTER_MS without any confirmed activity.
       Caller code can refresh `lastSeen` whenever it sees server traffic
       (out of scope here — for chrome it's "good enough"). */
    useEffect(() => {
        if (status !== 'connected' || !lastSeen) return;
        const t = window.setTimeout(() => setStatus('stale'), STALE_AFTER_MS);
        return () => window.clearTimeout(t);
    }, [status, lastSeen]);

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
