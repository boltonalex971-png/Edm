import React, {useCallback, useEffect, useRef, useState} from 'react'
import api from "../api.js";
import {PluginMessageTypes, usePluginMessaging} from "@microprojects/tools";
import {useSignalR} from "@microprojects/edm-components/hooks";
import {OperatorAction} from "./OperatorAction.tsx";
import './OperatorAction.scss'
import axios from "axios";

export const OperationPluginContainer = ({title, src, id, info, navigate, onMessage}) => {
    const url = new URL(document.location).searchParams.get('url')
    const target = useRef(new URL(url || src))
    const [frameId] = useState(Math.floor(Math.random() * 10000000).toString())
    const [step, setStep] = useState(null)
    const ref = useRef()
    const post = usePluginMessaging(ref.current?.contentWindow, frameId, target.current.origin, onMessage)
    useSignalR(`${api.baseUrl}/hub`, `Operation-${id}-operator`, (message) => {
        if (!message) return
        setStep(message)
        post({type: PluginMessageTypes.OPERATOR, data: message})
    }) 
    useSignalR(`${api.baseUrl}/hub`, `Operation-${id}-data`, (message) => {
        const data = Array.isArray(message) ? message : [message]
        data.forEach(post)
    })
    // For backward compatibility, can be deleted when all apps are ported to a new communication style 
    useSignalR(`${api.baseUrl}/hub`, `Operation-${id}-lifecycle`, (message) => {
        post({type: PluginMessageTypes.LIFECYCLE, data: message.state === 'InProgress' ? {start: true} : {stop: true}})
    })
    useEffect(() => post({type: PluginMessageTypes.NAVIGATE, data: navigate}), [navigate])
    const onLoad = () => post({type: PluginMessageTypes.INIT, data: info})
    const handleOperatorSubmit = (e) => {
        axios.post(`${api.baseUrl}/api/operator/${id}/response`, e.values)
            .then((response) => {
                setStep(null);
            })
    };

    return (
        <>
            {step && <OperatorAction step={step} onSubmit={handleOperatorSubmit} /> }
            <iframe
                style={{border: 0}}
                ref={ref}
                title={title}
                src={target.current.toString()}
                onLoad={onLoad}
                seamless
                width='100%'
            />
        </>
    )
}

