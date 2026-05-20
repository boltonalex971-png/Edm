import ReactMarkdown from 'react-markdown'
import { useTranslation } from 'react-i18next'
import remarkGfm from 'remark-gfm'

interface AboutPanelProps {
    markdown: string
    loading: boolean
    glyphColor: string
    glyphLabel: string
}

export function AboutPanel({
    markdown,
    loading,
    glyphColor,
    glyphLabel,
}: AboutPanelProps) {
    const { t } = useTranslation('hub')
    if (loading && !markdown) {
        return <div className="about-panel about-panel--loading">{t('about.loading')}</div>
    }
    return (
        <article className="about-panel">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    // Render the per-plugin glyph as the first inline child of the title
                    // so it sits on the same row as the H1 text, sharing its baseline.
                    h1: ({ children }) => (
                        <h1>
                            <span
                                className="about-glyph"
                                aria-hidden="true"
                                style={{ background: glyphColor }}
                            >
                                {glyphLabel}
                            </span>
                            <span className="about-title-text">{children}</span>
                        </h1>
                    ),
                }}
            >
                {markdown}
            </ReactMarkdown>
        </article>
    )
}
