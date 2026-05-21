import { Box, Typography } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { type DriverInfo, fetchDrivers } from '../api'
import { DataTable, type DataTableColumn } from '../components/DataTable'
import { resolveError } from '../i18n/resolveError'

interface DriversPageProps {
    onCount?: (count: number) => void
}

export function DriversPage({ onCount }: DriversPageProps) {
    const { t } = useTranslation('console')
    const [drivers, setDrivers] = useState<DriverInfo[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const columns = useMemo<DataTableColumn<DriverInfo>[]>(() => [
        {
            key: 'name',
            header: t('drivers.column.name', 'Driver'),
            width: '220px',
            render: (d) => <span className="cell-strong">{d.name}</span>,
        },
        {
            key: 'description',
            header: t('drivers.column.description', 'Description'),
            render: (d) => <span className="cell-muted">{d.description}</span>,
        },
        {
            key: 'profileName',
            header: t('drivers.column.profile', 'Profile'),
            width: '180px',
            render: (d) => <span className="cell-muted">{d.profileName || '—'}</span>,
        },
        {
            key: 'guid',
            header: t('drivers.column.guid', 'GUID'),
            width: '300px',
            render: (d) => <span className="cell-mono">{d.guid}</span>,
        },
    ], [t])

    useEffect(() => {
        let cancelled = false
        fetchDrivers()
            .then((d) => {
                if (cancelled) return
                setDrivers(d)
                onCount?.(d.length)
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
    }, [onCount])

    return (
        <Box className="page-stack">
            <section className="card">
                <header className="card-h">
                    <Typography component="h2" className="card-title">
                        {t('drivers.title', 'Drivers')}
                    </Typography>
                    <span className="card-count">{drivers.length}</span>
                </header>
                <div className="card-b">
                    {loading ? (
                        <div className="loading-eyebrow">{t('common:loading')}</div>
                    ) : error ? (
                        <div className="error-banner">{error}</div>
                    ) : (
                        <DataTable
                            columns={columns}
                            rows={drivers}
                            rowKey={(d) => d.guid || d.name}
                            emptyMessage={t('drivers.empty', 'No drivers loaded.')}
                        />
                    )}
                </div>
            </section>
        </Box>
    )
}
