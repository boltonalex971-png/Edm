import { Box, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import api from './api'

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
        <Box className="markdown" sx={{ maxWidth: 860, margin: '24px auto', padding: '0 16px' }}>
            {error && (
                <Typography color="error">
                    Failed to load changelog: {error}
                </Typography>
            )}
            {!error && text == null && <Typography>Loading…</Typography>}
            {text != null && (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
            )}
        </Box>
    )
}
