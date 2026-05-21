import {useEffect, useState} from 'react';
import {HubConnection, HubConnectionBuilder, LogLevel} from '@microsoft/signalr';
import {getCookie} from '../../hooks/getCookie';

// HANDOFF · v2 chrome.html 04f.4 · connection pip.
// Reflects the SignalR lifecycle directly — connecting / connected /
// reconnecting / disconnected. SignalR's own server keep-alive is the
// source of truth for whether the transport is alive; we don't layer a
// second client-side watchdog on top of it.

export type ConnectionStatus =
    | 'connecting'
    | 'connected'
    | 'reconnecting'
    | 'disconnected';

export interface ConnectionState {
    status: ConnectionStatus;
}

export interface UseConnectionStateOptions {
    /** Override the access-token source (default: read `X-Auth-Token` cookie). */
    getToken?: () => string | null | undefined | Promise<string | null | undefined>;
}

export function useConnectionState(hubUrl: string, options?: UseConnectionStateOptions): ConnectionState {
    const [status, setStatus] = useState<ConnectionStatus>('connecting');

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
            if (!stopped) setStatus('connected');
        });
        conn.onclose(() => {
            if (!stopped) setStatus('disconnected');
        });

        setStatus('connecting');
        conn.start()
            .then(() => {
                if (!stopped) setStatus('connected');
            })
            .catch(() => {
                if (!stopped) setStatus('disconnected');
            });

        return () => {
            stopped = true;
            conn.stop();
        };
    }, [hubUrl]);

    return {status};
}

/* Maps a status into the v2 .tb-pip slot props (kind class + label). */
export const STATUS_TO_PIP: Record<ConnectionStatus, {kind: string; label: string}> = {
    connecting:   {kind: 'connecting',   label: 'Connecting'},
    connected:    {kind: 'connected',    label: 'Live'},
    reconnecting: {kind: 'reconnecting', label: 'Reconnecting'},
    disconnected: {kind: 'disconnected', label: 'Offline'},
};
