import {useState, useEffect, useCallback, useRef} from 'react';
import {HubConnection, HubConnectionBuilder, LogLevel} from '@microsoft/signalr';
import { getCookie } from './hooks.js';

export enum PluginMessageTypes {
    init = 'Init',
    device = 'Device',
    audit = 'Audit',
    settings = 'Settings',
    navigate = 'Navigate'
}

export interface IMessage {
    type: PluginMessageTypes
    data: any
}

export interface IPluginMessage extends IMessage {
    frameId: string
}

export const usePluginMessaging = (plugin: Window, frameId: string, targetOrigin: string, 
    onMessage?: (msg: IMessage) => void) => {
    const cache = useRef<IPluginMessage[]>([])
    const target = useRef(targetOrigin)
    const send = useCallback((message : IMessage | undefined)  => {
        message && cache.current.push({...message, frameId})
        if (!plugin) return
        for (const m of cache.current) {
            plugin.postMessage(m, target.current)
        }
        cache.current = []
    }, [plugin])
    useEffect(() => {
        if (!plugin || !cache.current.length) return
        send(undefined)
    }, [plugin]);
    const onMessageReceive = useCallback((e: MessageEvent<IPluginMessage>) => {
        if (onMessage && e.data.frameId === frameId) {
            onMessage({data: e.data.data, type: e.data.type})
        }
    }, [frameId, onMessage])
    useEffect(() => {
        window.addEventListener('message', onMessageReceive)
        return () => window.removeEventListener('message', onMessageReceive)
    }, [])

    return send
}

const useSignalR =
    (hubUrl: string, channel: string = '', callback: (...args: any[]) => void) => {
        const [connection, setConnection] = useState<HubConnection | undefined>();
        const [isConnected, setIsConnected] = useState(false);
        const [error, setError] = useState(null);

        useEffect(() => {
            const token = getCookie('X-Auth-Token');
            const newConnection = new HubConnectionBuilder()
                .withUrl(hubUrl, {
                    withCredentials: false,
                    accessTokenFactory: () => token
                })
                .withAutomaticReconnect() // Optional: Configure automatic reconnect
                .configureLogging(LogLevel.Error) // Optional: Set logging level
                .build();

            setConnection(newConnection);

            return () => {
                // Clean up connection on unmount
                if (newConnection) {
                    newConnection.stop()
                }
            };
        }, [hubUrl]);

        useEffect(() => {
            if (connection) {
                connection.start()
                    .then(() => {
                        setIsConnected(true);
                        setError(null);
                        connection.invoke('Subscribe', channel)
                    })
                    .catch(e => {
                        setError(e);
                        setIsConnected(false);
                    });

                // Handle connection closed
                connection.onclose(e => {
                    setIsConnected(false);
                });
            }
        }, [connection]);

        // Function to send messages
        const sendMessage = async (methodName: string, ...args: any[]) => {
            if (connection && isConnected) {
                try {
                    await connection.invoke(methodName, ...args);
                } catch (e) {
                    console.error('Error invoking SignalR method: ', e);
                }
            } else {
                console.warn('Cannot send message: SignalR not connected.');
            }
        };
        useEffect(() => {
            if (connection && isConnected) {
                connection.on('Receive', callback);
            }
        }, [connection, isConnected]);

        return {error, sendMessage};
    };

export default useSignalR
