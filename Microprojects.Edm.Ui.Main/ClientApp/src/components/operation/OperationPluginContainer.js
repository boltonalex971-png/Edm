import React, { useCallback, useEffect, useRef, useState } from 'react'
import { types } from '@microprojects/react-utils'

export const OperationPluginContainer = ({ title, src, data, started, ...props }) => {
    const url = new URL(document.location).searchParams.get('url')
    const targetSource = url || src
    const targetOrigin = new URL(targetSource).origin
    console.log(targetSource, targetOrigin);
    const [frameId] = useState(Math.floor(Math.random() * 10000000).toString())
    const ref = useRef()
    useEffect(() => {
        if (started === undefined) return
        ref.current.contentWindow?.postMessage(
            { type: types.operationLifecycle, frameId, data: started ? { Start: true } : { Stop: true } },
            targetOrigin
        )
    }, [started])
    const onLoad = () => {
        ref.current.contentWindow.postMessage(
            { type: types.pluginData, frameId, data },
            targetOrigin
        )
    }

    return (
        <iframe
            style={{ border: 0 }}
            ref={ref}
            title={title}
            src={targetSource}
            onLoad={onLoad}
            seamless
            {...props}
        />
    )
}

