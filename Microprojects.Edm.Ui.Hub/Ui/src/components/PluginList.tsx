import { useTranslation } from 'react-i18next'
import { pluginColor, pluginGlyph, type PluginSummary } from '../api'

interface PluginListProps {
    plugins: PluginSummary[]
    loading: boolean
    error: string | null
    activeGuid: string | null
    onActivate: (guid: string | null) => void
}

export function PluginList({
    plugins,
    loading,
    error,
    activeGuid,
    onActivate,
}: PluginListProps) {
    const { t } = useTranslation('hub')
    const { t: tPlugins } = useTranslation('plugins')
    if (error) {
        return <div className="plugin-list-error">{error}</div>
    }
    if (loading && plugins.length === 0) {
        return <div className="plugin-list-empty">{t('pluginList.loadingModules')}</div>
    }
    if (plugins.length === 0) {
        return <div className="plugin-list-empty">{t('pluginList.empty')}</div>
    }
    return (
        // Activate-clear handlers live at the panel level (not per tile) so the
        // cursor moving between tiles, or focus moving between tiles, does not
        // bounce the right column back to the Hub default mid-traversal.
        // Only leaving the list as a whole reverts to Hub.
        <ul
            className="plugin-list"
            role="list"
            onMouseLeave={() => onActivate(null)}
            onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    onActivate(null)
                }
            }}
        >
            {plugins.map((p) => {
                const active = p.guid === activeGuid
                // Resolve localized name/description against the `plugins`
                // namespace, falling back to the server-supplied English
                // literal when the SPA's catalog lacks the key.
                const localName = p.nameKey ? tPlugins(p.nameKey, p.name) : p.name
                const localDesc = p.descriptionKey ? tPlugins(p.descriptionKey, p.description) : p.description
                return (
                    <li key={p.guid}>
                        <a
                            className={`plugin-card${active ? ' plugin-card--active' : ''}`}
                            href={`/${p.homepage ?? ''}`}
                            tabIndex={0}
                            aria-current={active ? 'true' : undefined}
                            onMouseEnter={() => onActivate(p.guid)}
                            onFocus={() => onActivate(p.guid)}
                        >
                            <div className="lead-row">
                                <div
                                    className="glyph"
                                    style={{ background: pluginColor(p.guid) }}
                                >
                                    {pluginGlyph(localName)}
                                </div>
                                <div className="name">
                                    <span className="edm-prefix">EDM</span>
                                    {localName}
                                </div>
                            </div>
                            <div className="desc">{localDesc}</div>
                        </a>
                    </li>
                )
            })}
        </ul>
    )
}
