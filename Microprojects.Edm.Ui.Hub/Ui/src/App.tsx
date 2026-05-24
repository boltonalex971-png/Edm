import {Box} from '@mui/material'
import {SmartScroll, SmartScrollContent} from '@microprojects/edm-components/components/chrome/SmartScroll'
import {Changelog} from '@microprojects/edm-components/components/chrome/Changelog'
import {useEffect, useMemo, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {Route, Routes} from 'react-router-dom'
import {resolveError} from './i18n/resolveError'
import {
    cleanName,
    fetchHubAbout,
    fetchPluginAbout,
    fetchPlugins,
    fetchUser,
    pluginColor,
    pluginGlyph,
    type PluginSummary,
    type UserInfo,
} from './api'
import {AboutPanel} from './components/AboutPanel'
import {Greeting} from './components/Greeting'
import {HubLayout} from './components/Layout'
import {PluginList} from './components/PluginList'
import './app.css'

const EMPTY_USER: UserInfo = {name: '', role: '', roles: [], divisions: []}

// Mirrors HubUiPlugin.PluginGuid on the backend. Used to derive the glyph
// shown above Hub's own ABOUT (when no plugin tile is active) so the visual
// stays consistent with the plugin tiles' color/label rules.
const HUB_IDENTITY = {
    guid: 'd2a92ef1-7b46-4956-859d-d48aa999385c',
    name: 'Hub',
}

// Top of the SmartScroll-stuck region: top of the landing wrapper, which
// sits below the 56px header.
const SMART_SCROLL_OFFSET = 64

export default function App() {
    const {t, i18n} = useTranslation('hub')
    const lng = i18n.language
    const [plugins, setPlugins] = useState<PluginSummary[]>([])
    const [user, setUser] = useState<UserInfo>(EMPTY_USER)
    const [hubAbout, setHubAbout] = useState<string>('')
    // Cache key is `<guid>::<lng>` so switching language transparently refetches
    // the per-locale ABOUT without throwing away cached entries from the previous locale.
    const [aboutCache, setAboutCache] = useState<Record<string, string>>({})
    const [activeGuid, setActiveGuid] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false
        Promise.all([fetchPlugins(), fetchUser(), fetchHubAbout()])
            .then(([pl, u, hub]) => {
                if (cancelled) return
                setPlugins(pl)
                setUser(u)
                setHubAbout(hub)
            })
            .catch((e: Error) => {
                if (cancelled) return
                setError(resolveError(e, t('loadFailed', {message: e.message})))
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => {
            cancelled = true
        }
        // Re-fetch on language change so hubAbout reflects the active locale.
    }, [t, lng])

    // Lazy-fetch a plugin's ABOUT the first time the user hovers/focuses its tile.
    useEffect(() => {
        if (!activeGuid) return
        const cacheKey = `${activeGuid}::${lng}`
        if (aboutCache[cacheKey] !== undefined) return
        let cancelled = false
        fetchPluginAbout(activeGuid)
            .then((md) => {
                if (cancelled) return
                setAboutCache((prev) => ({...prev, [cacheKey]: md}))
            })
            .catch(() => {
                // Plugin may not ship an ABOUT.md; treat as empty so we don't keep retrying.
                if (cancelled) return
                setAboutCache((prev) => ({...prev, [cacheKey]: ''}))
            })
        return () => {
            cancelled = true
        }
    }, [activeGuid, aboutCache, lng])

    const displayName = cleanName(user.name)

    const activeAbout = useMemo(() => {
        if (!activeGuid) return hubAbout
        const cached = aboutCache[`${activeGuid}::${lng}`]
        return cached !== undefined && cached !== '' ? cached : hubAbout
    }, [activeGuid, aboutCache, hubAbout, lng])

    // The glyph above the about title follows whichever plugin's promo is
    // currently shown. Falls back to Hub's identity when no tile is active or
    // when the active plugin's ABOUT is missing (we render hubAbout in that
    // case, so the glyph should match).
    const activeIdentity = useMemo(() => {
        if (!activeGuid) return HUB_IDENTITY
        const cached = aboutCache[`${activeGuid}::${lng}`]
        if (cached === '') return HUB_IDENTITY
        const p = plugins.find((x) => x.guid === activeGuid)
        return p ?? HUB_IDENTITY
    }, [activeGuid, aboutCache, plugins, lng])

    const landing = (
        <Box className="hub-landing">
            <div className="landing-grid">
                <div></div>
                <Greeting userName={displayName}/>
            </div>
            <SmartScroll
                offsetTop={SMART_SCROLL_OFFSET}
                className="landing-grid"
            >
                <SmartScrollContent className="landing-left">
                    <PluginList
                        plugins={plugins}
                        loading={loading}
                        error={error}
                        activeGuid={activeGuid}
                        onActivate={setActiveGuid}
                    />
                </SmartScrollContent>
                <SmartScrollContent className="landing-right">
                    <AboutPanel
                        key={activeGuid ?? 'hub'}
                        markdown={activeAbout}
                        loading={loading}
                        glyphColor={pluginColor(activeIdentity.guid)}
                        glyphLabel={pluginGlyph(activeIdentity.name)}
                    />
                </SmartScrollContent>
            </SmartScroll>
        </Box>
    )

    return (
        <HubLayout user={user}>
            <Routes>
                <Route index element={landing}/>
                <Route
                    path="/changes"
                    element={<Changelog changelogUrl="/api/hub/meta/changelog"/>}
                />
                <Route path="*" element={landing}/>
            </Routes>
        </HubLayout>
    )
}
