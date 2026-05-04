import api from '@logistics/features/api/api'
import { SmartScrollContent } from '@microprojects/tools'
import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export function Changelog() {
    const [text, setText] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const controller = new AbortController()
        fetch(`${api.meta}/changelog`, {
            credentials: 'include',
            signal: controller.signal,
        })
            .then(async (r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`)
                return r.text()
            })
            .then(setText)
            .catch((e) => {
                if (e.name !== 'AbortError') setError(e.message)
            })
        return () => controller.abort()
    }, [])

    return (
        <SmartScrollContent>
            <div className="changelog">
                {error && <p>Failed to load changelog: {error}</p>}
                {!error && text == null && <p>Loading…</p>}
                {text != null && (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {text}
                    </ReactMarkdown>
                )}
            </div>
        </SmartScrollContent>
    )
}
