import React, {useCallback, useEffect, useRef, useState} from 'react'
import api from "../api.js";
import {PluginMessageTypes, usePluginMessaging} from "@microprojects/tools";
import useSignalR from "../hooks/signalRHooks.ts";

export const OperationPluginContainer = ({ title, src, id, options, info, navigate, onMessage }) => {
    const url = new URL(document.location).searchParams.get('url')
    const target = useRef(new URL(url || src))
    const [frameId] = useState(Math.floor(Math.random() * 10000000).toString())
    const ref = useRef()
    const post = usePluginMessaging(ref.current?.contentWindow, frameId, target.current.origin, onMessage)
    useSignalR(`${api.baseUrl}/hub`, `Operation-${id}-data`, (message) => {
        const data = Array.isArray(message) ? message : [message]
        data.forEach(post)
    })
    useEffect(() => post({type: PluginMessageTypes.NAVIGATE, data: navigate}), [navigate])
    const onLoad = () => post({type: PluginMessageTypes.INIT, data: info})

    return (
        <iframe
            style={{ border: 0 }}
            ref={ref}
            title={title}
            src={target.current.toString()}
            onLoad={onLoad}
            seamless
            width='100%'
        />
    )
}

