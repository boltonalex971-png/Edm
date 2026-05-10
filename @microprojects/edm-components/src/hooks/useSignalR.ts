import {useState, useEffect} from 'react';
import {HubConnection, HubConnectionBuilder, LogLevel} from '@microsoft/signalr';
import {getCookie} from './getCookie';

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

export const useSignalR = (
    hubUrl: string,
    channel: string = '',
    callback: (...args: any[]) => void
) => {
    const [connection, setConnection] = useState<HubConnection | undefined>();
    const [isConnected, setIsConnected] = useState(false);
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
            if (newConnection) {
                newConnection.stop();
            }
        };
    }, [hubUrl]);

    useEffect(() => {
        if (connection) {
            connection.start()
                .then(() => {
                    setIsConnected(true);
                    setError(null);
                    connection.invoke('Subscribe', channel);
                })
                .catch((e: any) => {
                    setError(e);
                    setIsConnected(false);
                });

            connection.onclose(() => {
                setIsConnected(false);
            });
        }
    }, [connection]);

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

export default useSignalR;
