import { useState, useRef, useEffect } from "react"
import { LoadingContainer } from "./Utils"
import { PluginMessageTypes } from "./messagingHooks"

interface PluginContainerProps {
    title: string,
    src: string,
    data: any,
    onDataReceived: (data: any, type: PluginMessageTypes) => void
}

export const PluginContainer = ({ title, src, data, onDataReceived }: PluginContainerProps) => {
    const [frameId] = useState(Math.floor(Math.random() * 10000000).toString())
    const ref = useRef<HTMLIFrameElement>(null)
    const listener = (e: MessageEvent<any>) => {
        if (e.data.frameId === frameId) {
            if (e.data.type === PluginMessageTypes.RESIZE) {
                const maxHeight = document.documentElement.clientHeight * 0.8
                const height =
                    e.data.height < maxHeight ? e.data.height : maxHeight
                ref!.current!.style.height = `${height + 20}px`
            } else if (e.data.type) {
                onDataReceived(e.data.data, e.data.type)
            }
        }
    }
    useEffect(() => {
        window.addEventListener('message', listener)
        return () => window.removeEventListener('message', listener)
    })
    const [iframeLoading, setIframeLoading] = useState(true)
    const onLoad = () => {
        ref.current!.contentWindow!.postMessage(
            { type: PluginMessageTypes.INIT, frameId, data },
            src
        )
        setIframeLoading(false)
    }

    return (
        <LoadingContainer loading={iframeLoading}>
            <iframe
                style={{ border: 0 }}
                ref={ref}
                title={title}
                src={src}
                onLoad={onLoad}
                seamless
                width='100%'
            />
        </LoadingContainer>
    )
}

