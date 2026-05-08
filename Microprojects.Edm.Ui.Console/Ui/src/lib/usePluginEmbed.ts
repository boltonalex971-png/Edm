import { useEffect, useRef, useState } from 'react'

// Mirrors the postMessage contract in @microprojects/react-utils' PluginContainer:
//   parent -> child : { type: 'pluginData',  frameId, data }
//   child  -> parent: { type: 'pluginResize', frameId, height }
// Technologies' HostConsole embeds Console via PluginContainer and clamps the
// iframe to 80% of its own viewport, growing with whatever height we post.
// We post a single very-large value on handshake so the iframe parks at the
// max — internal layout (fill + card-b scroll) handles overflow from there,
// instead of the iframe (and the parent Detail) ballooning with content.
const REQUEST_MAX_HEIGHT = 999999

interface PluginDataMessage {
    type: 'pluginData'
    frameId: string
    data?: unknown
}

interface UsePluginEmbedResult {
    embedded: boolean
    hostData: unknown
}

export function usePluginEmbed(): UsePluginEmbedResult {
    const embedded = typeof window !== 'undefined' && window.self !== window.top
    const [hostData, setHostData] = useState<unknown>(undefined)
    const frameIdRef = useRef<string | undefined>(undefined)

    useEffect(() => {
        if (!embedded) return

        const onMessage = (e: MessageEvent) => {
            const msg = e.data as PluginDataMessage | undefined
            if (msg && msg.type === 'pluginData') {
                frameIdRef.current = msg.frameId
                setHostData(msg.data)
                window.parent.postMessage(
                    {
                        type: 'pluginResize',
                        frameId: msg.frameId,
                        height: REQUEST_MAX_HEIGHT,
                    },
                    '*',
                )
            }
        }
        window.addEventListener('message', onMessage)
        return () => {
            window.removeEventListener('message', onMessage)
        }
    }, [embedded])

    return { embedded, hostData }
}
