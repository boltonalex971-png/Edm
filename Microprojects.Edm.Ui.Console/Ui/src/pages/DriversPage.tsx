import { Box, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { type DriverInfo, fetchDrivers } from '../api'
import { DataTable, type DataTableColumn } from '../components/DataTable'

const COLUMNS: DataTableColumn<DriverInfo>[] = [
    {
        key: 'name',
        header: 'Driver',
        width: '220px',
        render: (d) => <span className="cell-strong">{d.name}</span>,
    },
    {
        key: 'description',
        header: 'Description',
        render: (d) => <span className="cell-muted">{d.description}</span>,
    },
    {
        key: 'profileName',
        header: 'Profile',
        width: '180px',
        render: (d) => <span className="cell-muted">{d.profileName || '—'}</span>,
    },
    {
        key: 'guid',
        header: 'GUID',
        width: '300px',
        render: (d) => <span className="cell-mono">{d.guid}</span>,
    },
]

interface DriversPageProps {
    onCount?: (count: number) => void
}

export function DriversPage({ onCount }: DriversPageProps) {
    const [drivers, setDrivers] = useState<DriverInfo[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

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
                setError(e.message)
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
                        Drivers
                    </Typography>
                    <span className="card-count">{drivers.length}</span>
                </header>
                <div className="card-b">
                    {loading ? (
                        <div className="loading-eyebrow">Loading…</div>
                    ) : error ? (
                        <div className="error-banner">{error}</div>
                    ) : (
                        <DataTable
                            columns={COLUMNS}
                            rows={drivers}
                            rowKey={(d) => d.guid || d.name}
                            emptyMessage="No drivers loaded."
                        />
                    )}
                </div>
            </section>
        </Box>
    )
}
