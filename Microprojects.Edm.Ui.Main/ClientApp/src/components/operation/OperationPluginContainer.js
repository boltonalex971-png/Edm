import React, { useCallback, useEffect, useRef, useState } from 'react'
import { types } from '@microprojects/react-utils'

export const OperationPluginContainer = ({ title, src, data, started, ...props }) => {
    const [frameId] = useState(Math.floor(Math.random() * 10000000).toString())
    const ref = useRef()
    // const listener = useCallback(
    //     (e) => {
    //         if (e.data.frameId === frameId && e.data.type === operationDataType) {
    //             console.log(e.data);
    //         }
    //     },
    //     [frameId]
    // )
    // useEffect(() => {
    //     window.addEventListener('message', listener)
    //     return () => window.removeEventListener('message', listener)
    // }, [listener])
    useEffect(() => {
        if (started === undefined) return
        ref.current.contentWindow.postMessage(
            { type: types.operationLifecycle, frameId, data: started ? { Start: true } : { Stop: true } },
            src
        )
    }, [started])
    const onLoad = () => {
        ref.current.contentWindow.postMessage(
            { type: types.pluginData, frameId, data },
            src
        )
    }

    return (
        <iframe
            style={{ border: 0 }}
            ref={ref}
            title={title}
            src={src}
            onLoad={onLoad}
            seamless
            {...props}
        />
    )
}

export function usePluginData() {
    const [state, setState] = useState({})
    const listener = useCallback((e) => {
        if (e.data.frameId !== state.frameId) {
            setState(e.data)
        } else {
            setState((d) => ({ ...d, ...e.data }))
        }
    }, [state.frameId])
    const setData = useCallback((d) => {
        setState((s) => ({ ...s, data: d }))
        window.parent.postMessage(state, '*')
    }, [state])
    useEffect(() => {
        window.addEventListener('message', listener)
        return () => window.removeEventListener('message', listener)
    }, [listener])

    return [state.data, setData]
}
