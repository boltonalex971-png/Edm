import api from '@logistics/features/api/api'
import { SmartScrollContent } from '@microprojects/tools'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export function Changelog() {
    const { t, i18n } = useTranslation()
    const lng = i18n.language
    const [text, setText] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        setText(null)
        setError(null)
        const controller = new AbortController()
        // Stamp Accept-Language explicitly — fetch() doesn't pick up the
        // axios interceptor, so without this the server falls back to its
        // default culture and returns the English file.
        fetch(`${api.meta}/changelog`, {
            credentials: 'include',
            signal: controller.signal,
            headers: { 'Accept-Language': lng },
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
    }, [lng])

    return (
        <SmartScrollContent>
            <div className="changelog">
                {error && <p>{t('widgets:changelog.loadFailed', { error })}</p>}
                {!error && text == null && <p>{t('loading')}</p>}
                {text != null && (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {text}
                    </ReactMarkdown>
                )}
            </div>
        </SmartScrollContent>
    )
}
