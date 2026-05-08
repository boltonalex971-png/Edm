import { Box, Chip, Stack, Typography } from '@mui/material'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { fetchLog, fetchLogLevels, type LogEntry } from '../api'
import { type SignalKind, StatusBadge } from '../components/StatusBadge'

const PAGE_SIZE = 50

const LEVEL_KINDS: Record<string, SignalKind> = {
    error: 'fault',
    fail: 'fault',
    failure: 'fault',
    warning: 'warn',
    warn: 'warn',
    information: 'info',
    info: 'info',
}

function levelToKind(level: string): SignalKind {
    return LEVEL_KINDS[level.toLowerCase()] ?? 'idle'
}

function formatTimestamp(iso: string): string {
    const d = new Date(iso)
    if (Number.isNaN(d.valueOf())) return iso
    return d.toLocaleString()
}

export function LogPage() {
    const [entries, setEntries] = useState<LogEntry[]>([])
    const [levels, setLevels] = useState<string[]>([])
    const [activeLevel, setActiveLevel] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const sentinelRef = useRef<HTMLDivElement | null>(null)
    // requestId guards against out-of-order responses when the user toggles
    // filters faster than the network can answer. Only the latest filter's
    // batch is allowed to mutate state.
    const requestIdRef = useRef(0)

    // Levels chip list — fetched once.
    useEffect(() => {
        let cancelled = false
        fetchLogLevels()
            .then((lvls) => {
                if (!cancelled) setLevels(lvls)
            })
            .catch(() => {
                /* level chips just stay hidden */
            })
        return () => {
            cancelled = true
        }
    }, [])

    // Reset + load first page whenever the filter changes.
    useEffect(() => {
        const id = ++requestIdRef.current
        setEntries([])
        setHasMore(true)
        setError(null)
        setLoading(true)

        fetchLog(0, PAGE_SIZE, activeLevel ?? undefined)
            .then((rows) => {
                if (requestIdRef.current !== id) return
                setEntries(rows)
                setHasMore(rows.length === PAGE_SIZE)
            })
            .catch((e: Error) => {
                if (requestIdRef.current !== id) return
                setError(e.message)
            })
            .finally(() => {
                if (requestIdRef.current === id) setLoading(false)
            })
    }, [activeLevel])

    const loadMore = useCallback(() => {
        if (loading || loadingMore || !hasMore) return
        const id = requestIdRef.current
        setLoadingMore(true)
        const startFrom = entries.length
        fetchLog(startFrom, PAGE_SIZE, activeLevel ?? undefined)
            .then((rows) => {
                if (requestIdRef.current !== id) return
                setEntries((prev) => [...prev, ...rows])
                setHasMore(rows.length === PAGE_SIZE)
            })
            .catch((e: Error) => {
                if (requestIdRef.current !== id) return
                setError(e.message)
            })
            .finally(() => {
                if (requestIdRef.current === id) setLoadingMore(false)
            })
    }, [activeLevel, entries.length, hasMore, loading, loadingMore])

    // Sentinel observer — pre-fetch when the loader sentinel comes within
    // 200px of the viewport. rootMargin gives us a head start so the next
    // page is in by the time the user reaches the visible end.
    useEffect(() => {
        const node = sentinelRef.current
        if (!node) return
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) loadMore()
            },
            { rootMargin: '200px 0px' },
        )
        observer.observe(node)
        return () => observer.disconnect()
    }, [loadMore])

    const cardCount = useMemo(() => entries.length + (hasMore ? '+' : ''), [
        entries.length,
        hasMore,
    ])

    return (
        <Box className="page-stack page-stack--fill">
            <section className="card card--fill">
                <header className="card-h">
                    <Typography component="h2" className="card-title">
                        Host log
                    </Typography>
                    <span className="card-count">{cardCount}</span>
                </header>
                {levels.length > 0 && (
                    <div className="card-toolbar">
                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                            <Chip
                                label="All"
                                size="small"
                                variant={activeLevel === null ? 'filled' : 'outlined'}
                                color={activeLevel === null ? 'primary' : 'default'}
                                onClick={() => setActiveLevel(null)}
                            />
                            {levels.map((lvl) => (
                                <Chip
                                    key={lvl}
                                    label={lvl}
                                    size="small"
                                    variant={activeLevel === lvl ? 'filled' : 'outlined'}
                                    color={activeLevel === lvl ? 'primary' : 'default'}
                                    onClick={() => setActiveLevel(lvl)}
                                />
                            ))}
                        </Stack>
                    </div>
                )}
                <div className="card-b">
                    {loading ? (
                        <div className="loading-eyebrow">Loading…</div>
                    ) : error ? (
                        <div className="error-banner">{error}</div>
                    ) : entries.length === 0 ? (
                        <div className="empty-state">No log entries.</div>
                    ) : (
                        <ul className="log-feed">
                            {entries.map((entry, i) => (
                                <li key={`${entry.timeGenerated}-${i}`} className="log-entry">
                                    <div className="log-entry-head">
                                        <span className="log-time">
                                            {formatTimestamp(entry.timeGenerated)}
                                        </span>
                                        <span className="log-source">{entry.source}</span>
                                        <StatusBadge
                                            kind={levelToKind(entry.entryType)}
                                            label={entry.entryType}
                                        />
                                    </div>
                                    <pre className="log-message">{entry.message}</pre>
                                </li>
                            ))}
                            <li ref={sentinelRef} className="log-sentinel" aria-hidden>
                                {loadingMore ? (
                                    <span className="loading-eyebrow">Loading more…</span>
                                ) : !hasMore ? (
                                    <span className="loading-eyebrow">End of log</span>
                                ) : null}
                            </li>
                        </ul>
                    )}
                </div>
            </section>
        </Box>
    )
}
