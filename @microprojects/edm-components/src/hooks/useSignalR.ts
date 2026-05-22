import {useState, useEffect} from 'react';
import {type HubConnection, HubConnectionBuilder, LogLevel} from '@microsoft/signalr';
import {getCookie} from './getCookie';

// Pre-existing constants — keep so callers that imported them still resolve.
export enum PluginMessageTypes {
    init = 'Init',
    device = 'Device',
    audit = 'Audit',
    settings = 'Settings',
    navigate = 'Navigate',
}

export interface IMessage {
    type: PluginMessageTypes;
    data: any;
}

export interface IPluginMessage extends IMessage {
    frameId: string;
}

// Module-scope mirror of the latest hub connection id. Callers (e.g. an
// axios request interceptor that stamps `X-Edm-Connection-Id` on every
// API call) read this so the server can echo the id back in published
// messages and a SignalR bridge can suppress self-echo. Null until the
// hub connects; reset on close and updated on reconnect.
let currentConnectionId: string | null = null;

export function getCurrentConnectionId(): string | null {
    return currentConnectionId;
}

// Module-scope sender, populated by the active useSignalR instance. Lets
// arbitrary callers publish to the channel without each holding its own
// hub connection. Plugins build typed wrappers on top (e.g. Logistics's
// publishLogisticsMessage).
export type Sender = (methodName: string, ...args: any[]) => Promise<void>;
let currentSender: Sender | null = null;

export function getCurrentSender(): Sender | null {
    return currentSender;
}

type UseSignalRResult = {
    error: unknown;
    sendMessage: Sender;
    connectionId: string | null;
};

export const useSignalR = (
    hubUrl: string,
    channel: string,
    callback: (...args: any[]) => void,
): UseSignalRResult => {
    const [connection, setConnection] = useState<HubConnection | undefined>();
    const [isConnected, setIsConnected] = useState(false);
    const [connectionId, setConnectionId] = useState<string | null>(null);
    const [error, setError] = useState<unknown>(null);

    useEffect(() => {
        const token = getCookie('X-Auth-Token');
        const newConnection = new HubConnectionBuilder()
            .withUrl(hubUrl, {
                withCredentials: false,
                accessTokenFactory: () => token ?? '',
            })
            .withAutomaticReconnect()
            .configureLogging(LogLevel.Error)
            .build();

        setConnection(newConnection);

        return () => {
            newConnection.stop().catch(() => {});
        };
    }, [hubUrl]);

    useEffect(() => {
        if (!connection) return;
        connection
            .start()
            .then(() => {
                setIsConnected(true);
                setError(null);
                currentConnectionId = connection.connectionId ?? null;
                setConnectionId(currentConnectionId);
                connection.invoke('Subscribe', channel).catch((e) => setError(e));
            })
            .catch((e) => {
                setError(e);
                setIsConnected(false);
            });

        connection.onclose(() => {
            setIsConnected(false);
            // Identity guard mirrors the currentSender cleanup: when multiple
            // useSignalR instances share the module-scope id (Tech mounts
            // multiple channel hooks against the same hub), an earlier hook's
            // close must not null an id that a still-live hook owns.
            if (currentConnectionId === connection.connectionId) currentConnectionId = null;
            setConnectionId(null);
        });
        connection.onreconnected((id) => {
            setIsConnected(true);
            setError(null);
            currentConnectionId = id ?? null;
            setConnectionId(currentConnectionId);
            // Re-subscribe after reconnect — group memberships do not survive
            // a reconnect on the server side.
            connection.invoke('Subscribe', channel).catch((e) => setError(e));
        });
    }, [connection, channel]);

    useEffect(() => {
        if (!connection || !isConnected) return;
        connection.on('Receive', callback);
        return () => {
            connection.off('Receive', callback);
        };
    }, [connection, isConnected, callback]);

    const sendMessage: Sender = async (methodName, ...args) => {
        if (connection && isConnected) {
            try {
                await connection.invoke(methodName, ...args);
            } catch (e) {
                console.error('Error invoking SignalR method:', e);
            }
        } else {
            console.warn('Cannot send message: SignalR not connected.');
        }
    };

    useEffect(() => {
        currentSender = isConnected ? sendMessage : null;
        return () => {
            if (currentSender === sendMessage) currentSender = null;
        };
        // sendMessage is recreated each render; only re-run when connection state changes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isConnected]);

    return {error, sendMessage, connectionId};
};

export default useSignalR;
