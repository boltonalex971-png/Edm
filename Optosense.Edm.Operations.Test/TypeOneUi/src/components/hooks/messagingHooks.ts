import {useState, useEffect, useCallback, useRef} from 'react';

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

export const usePluginMessaging = (plugin: Window, frameId: string | undefined, targetOrigin: string | undefined, 
    onMessage?: (msg: IMessage) => void) => {
    const cache = useRef<IPluginMessage[]>([])
    const target = useRef(targetOrigin || plugin.location.origin)
    const frame = useRef(frameId)
    const send = useCallback((message : IMessage | undefined)  => {
        message && cache.current.push({...message, frameId: frame.current})
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
        if (!frame.current) {
            frame.current = e.data.frameId;
        }
        if (onMessage && e.data.frameId === frame.current) {
            onMessage({data: e.data.data, type: e.data.type})
        }
    }, [onMessage])
    useEffect(() => {
        window.addEventListener('message', onMessageReceive)
        return () => window.removeEventListener('message', onMessageReceive)
    }, [onMessageReceive])

    return send
}

type OperationDataHandler = (data: IPluginMessage) => void

/**
 * @callback OperationDataHandler
 * @param {any} data Incoming data as Object or Array.
 * @returns {void}
 */
/**
 * Supply the data on specified type from inter-window messaging.
 * Type of {@linkcode initialState} specifies the behavior of data collecting:
 *  - Object: keep the last received data only
 *  - Array: keep all received data in array
 *  - undefined: depends on type of first received data
 * @param {string} type Predefined type of data. Can be 'Navigate', 'Init', 'Device', 'Audit'.
 * @param {any} initialState Initial data to store.
 * @param {OperationDataHandler} handler The callback to process received data
 * @returns {any} Incoming data of desired type as Object or Array
 */
export function useOperationData(type: string, initialState: any, handler: OperationDataHandler): any {
    const [state, setState] = useState();
    const handle = useCallback(handler || (() => {}), [])
    const listener = useCallback((e) => {
        if (e.data.type !== type) return
        let data = Array.isArray(e.data.data) ? e.data.data : [e.data.data]
        setState((s) =>
            Array.isArray(state || initialState || e.data.data) ? [...(s || []), ...data] : data.at(-1))
        // Find out is result is array or object
        handle(Array.isArray(state || initialState || e.data.data) ? data : data.at(-1))
    }, [type])
    useEffect(() => {
        window.addEventListener('message', listener)
        return () => window.removeEventListener('message', listener)
    }, [listener])

    if (!state && initialState) {
        listener({data: {type, data: initialState}});
    }

    return state
}

