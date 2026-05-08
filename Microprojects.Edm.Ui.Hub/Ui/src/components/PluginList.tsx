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
    if (error) {
        return (
            <div className="plugin-list-error">{error}</div>
        )
    }
    if (loading && plugins.length === 0) {
        return <div className="plugin-list-empty">Loading modules…</div>
    }
    if (plugins.length === 0) {
        return (
            <div className="plugin-list-empty">
                No application plugins are loaded.
            </div>
        )
    }
    return (
        <ul className="plugin-list" role="list">
            {plugins.map((p) => {
                const active = p.guid === activeGuid
                return (
                    <li key={p.guid}>
                        <a
                            className={`plugin-card${active ? ' plugin-card--active' : ''}`}
                            href={`/${p.homepage ?? ''}`}
                            tabIndex={0}
                            aria-current={active ? 'true' : undefined}
                            onMouseEnter={() => onActivate(p.guid)}
                            onMouseLeave={() => onActivate(null)}
                            onFocus={() => onActivate(p.guid)}
                            onBlur={() => onActivate(null)}
                        >
                            <div className="lead-row">
                                <div
                                    className="glyph"
                                    style={{ background: pluginColor(p.guid) }}
                                >
                                    {pluginGlyph(p.name)}
                                </div>
                                <div className="name">
                                    <span className="edm-prefix">EDM</span>
                                    {p.name}
                                </div>
                            </div>
                            <div className="desc">{p.description}</div>
                        </a>
                    </li>
                )
            })}
        </ul>
    )
}
