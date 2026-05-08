import { Box, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import {
    type AvailableTask,
    fetchAvailableTasks,
    fetchRunningTasks,
} from '../api'
import { DataTable, type DataTableColumn } from '../components/DataTable'
import { StatusBadge, statusToKind } from '../components/StatusBadge'

const COLUMNS: DataTableColumn<AvailableTask>[] = [
    {
        key: 'name',
        header: 'Job',
        width: '240px',
        render: (t) => <span className="cell-strong">{t.name}</span>,
    },
    {
        key: 'description',
        header: 'Description',
        render: (t) => <span className="cell-muted">{t.description}</span>,
    },
    {
        key: 'status',
        header: 'Status',
        width: '140px',
        render: (t) =>
            t.status ? (
                <StatusBadge kind={statusToKind(t.status)} label={t.status} />
            ) : (
                <span className="cell-muted">—</span>
            ),
    },
    {
        key: 'type',
        header: 'Lifetime',
        width: '120px',
        render: (t) => <span className="cell-muted">{t.type || '—'}</span>,
    },
]

interface JobsPageProps {
    onCounts?: (counts: { running: number; available: number }) => void
}

export function JobsPage({ onCounts }: JobsPageProps) {
    const [running, setRunning] = useState<AvailableTask[]>([])
    const [available, setAvailable] = useState<AvailableTask[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false
        Promise.all([fetchRunningTasks(), fetchAvailableTasks()])
            .then(([r, a]) => {
                if (cancelled) return
                setRunning(r)
                setAvailable(a)
                onCounts?.({ running: r.length, available: a.length })
            })
            .catch((e: Error) => {
                if (cancelled) return
                setError(e.message)
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => {
            cancelled = true
        }
    }, [onCounts])

    return (
        <Box className="page-stack">
            <section className="card">
                <header className="card-h">
                    <Typography component="h2" className="card-title">
                        Running
                    </Typography>
                    <span className="card-count">{running.length}</span>
                </header>
                <div className="card-b">
                    {loading ? (
                        <div className="loading-eyebrow">Loading…</div>
                    ) : error ? (
                        <div className="error-banner">{error}</div>
                    ) : (
                        <DataTable
                            columns={COLUMNS}
                            rows={running}
                            rowKey={(t) => t.name}
                            emptyMessage="No running jobs."
                        />
                    )}
                </div>
            </section>

            <section className="card">
                <header className="card-h">
                    <Typography component="h2" className="card-title">
                        Available
                    </Typography>
                    <span className="card-count">{available.length}</span>
                </header>
                <div className="card-b">
                    {loading ? (
                        <div className="loading-eyebrow">Loading…</div>
                    ) : error ? (
                        <div className="error-banner">{error}</div>
                    ) : (
                        <DataTable
                            columns={COLUMNS}
                            rows={available}
                            rowKey={(t) => t.name}
                            emptyMessage="No available jobs."
                        />
                    )}
                </div>
            </section>
        </Box>
    )
}
