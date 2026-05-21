import { Box, Typography } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
    type AvailableTask,
    fetchAvailableTasks,
    fetchRunningTasks,
} from '../api'
import { DataTable, type DataTableColumn } from '../components/DataTable'
import { StatusBadge, statusToKind } from '../components/StatusBadge'
import { resolveError } from '../i18n/resolveError'

interface JobsPageProps {
    onCounts?: (counts: { running: number; available: number }) => void
}

export function JobsPage({ onCounts }: JobsPageProps) {
    const { t } = useTranslation('console')
    const [running, setRunning] = useState<AvailableTask[]>([])
    const [available, setAvailable] = useState<AvailableTask[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const columns = useMemo<DataTableColumn<AvailableTask>[]>(() => [
        {
            key: 'name',
            header: t('jobs.column.name', 'Job'),
            width: '240px',
            render: (task) => <span className="cell-strong">{task.name}</span>,
        },
        {
            key: 'description',
            header: t('jobs.column.description', 'Description'),
            render: (task) => <span className="cell-muted">{task.description}</span>,
        },
        {
            key: 'status',
            header: t('jobs.column.status', 'Status'),
            width: '140px',
            render: (task) =>
                task.status ? (
                    <StatusBadge kind={statusToKind(task.status)} label={task.status} />
                ) : (
                    <span className="cell-muted">—</span>
                ),
        },
        {
            key: 'type',
            header: t('jobs.column.lifetime', 'Lifetime'),
            width: '120px',
            render: (task) => <span className="cell-muted">{task.type || '—'}</span>,
        },
    ], [t])

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
                setError(resolveError(e, t('common:error')))
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
                        {t('jobs.card.running', 'Running')}
                    </Typography>
                    <span className="card-count">{running.length}</span>
                </header>
                <div className="card-b">
                    {loading ? (
                        <div className="loading-eyebrow">{t('common:loading')}</div>
                    ) : error ? (
                        <div className="error-banner">{error}</div>
                    ) : (
                        <DataTable
                            columns={columns}
                            rows={running}
                            rowKey={(task) => task.name}
                            emptyMessage={t('jobs.empty.running', 'No running jobs.')}
                        />
                    )}
                </div>
            </section>

            <section className="card">
                <header className="card-h">
                    <Typography component="h2" className="card-title">
                        {t('jobs.card.available', 'Available')}
                    </Typography>
                    <span className="card-count">{available.length}</span>
                </header>
                <div className="card-b">
                    {loading ? (
                        <div className="loading-eyebrow">{t('common:loading')}</div>
                    ) : error ? (
                        <div className="error-banner">{error}</div>
                    ) : (
                        <DataTable
                            columns={columns}
                            rows={available}
                            rowKey={(task) => task.name}
                            emptyMessage={t('jobs.empty.available', 'No available jobs.')}
                        />
                    )}
                </div>
            </section>
        </Box>
    )
}
