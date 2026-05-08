import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface AboutPanelProps {
    markdown: string
    loading: boolean
}

export function AboutPanel({ markdown, loading }: AboutPanelProps) {
    if (loading && !markdown) {
        return <div className="about-panel about-panel--loading">Loading…</div>
    }
    return (
        <article className="about-panel">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
        </article>
    )
}
