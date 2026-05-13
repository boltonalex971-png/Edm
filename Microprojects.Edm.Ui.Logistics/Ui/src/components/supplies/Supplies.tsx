import api from '@features/api/api'
import { Loading } from '@features/utils/Utils.tsx'
import { Detail } from '@logistics/components/MasterDetail'
import { SupplyDetail } from '@logistics/components/supplies/SupplyDetail'
import type { Supply } from '@logistics/data/types'
import { useGet } from '@logistics/hooks/hooks'
import { formatLocalDateTime } from '@logistics/utils/format'
import { SubRootPage } from '@microprojects/edm-components/components/chrome/SubRootPage'
import { useBasePath } from '@microprojects/edm-components/hooks/useBasePath'
import { Search } from '@microprojects/edm-components/components/page/Search'
import {
    Add as AddIcon,
    CheckCircleOutlined as ConsumedIcon,
    Inventory2Outlined as RemainsIcon,
    Search as SearchIcon,
} from '@mui/icons-material'
import {
    Alert,
    Box,
    InputAdornment,
    TextField,
} from '@mui/material'
import {
    DataGrid,
    type GridColDef,
    type GridRowParams,
} from '@mui/x-data-grid'
import type React from 'react'
import { type EffectCallback, useEffect, useMemo, useState } from 'react'

export function Supplies() {
    const path = useBasePath()

    const menuItems = [
        { label: 'Remains', path: `${path}/remaining`, icon: <RemainsIcon fontSize="small" /> },
        { label: 'Consumed', path: `${path}/consumed`, icon: <ConsumedIcon fontSize="small" /> },
    ]

    return (
        <SubRootPage title="Supplies" menuItems={menuItems}>
            <Search
                actions={[
                    {
                        key: 'search',
                        label: 'Search',
                        icon: <SearchIcon fontSize="small" />,
                        panel: <SupplySearch />,
                    },
                    {
                        key: 'create',
                        label: 'Create new',
                        icon: <AddIcon fontSize="small" />,
                        panel: (
                            <SupplyDetail
                                title="New Supply"
                                editMode={true}
                                api={api.supplies}
                            />
                        ),
                    },
                ]}
            />
        </SubRootPage>
    )
}

const COLUMNS: GridColDef<Supply>[] = [
    { field: 'barcode', headerName: 'Barcode', flex: 1, minWidth: 140 },
    { field: 'shipment', headerName: 'Shipment', flex: 1, minWidth: 140 },
    { field: 'shipmentExternalId', headerName: 'Shipment Id', flex: 1, minWidth: 140 },
    {
        field: 'metaCreated',
        headerName: 'Created',
        flex: 1,
        minWidth: 160,
        renderCell: (p) => formatLocalDateTime(p.value as any),
    },
]

function SupplySearch() {
    const [[data], loading, error] = useGet<Supply[]>(`${api.supplies}`, [api])
    const [filter, setFilter] = useState<string>('')
    const [subDetail, setSubDetail] = useState<React.ReactElement>()

    useEffect(setSubDetail as EffectCallback, [])

    const filteredData = useMemo(() => {
        const lower = filter.toLowerCase()
        if (!lower) return data || []
        return (data || []).filter(
            (s) =>
                s.barcode?.toLowerCase().includes(lower) ||
                s.shipment?.toLowerCase().includes(lower) ||
                s.shipmentExternalId?.toLowerCase().includes(lower),
        )
    }, [data, filter])

    return (
        <Detail
            type="supply"
            onClose={() => {}}
            icon={<SearchIcon />}
            loading={loading}
            error={error as any}
            data={
                {
                    name: 'Supply search',
                    description: 'Search for supplies',
                } as any
            }
            subDetail={subDetail}
            card={
                <Box>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Search by shipment or barcode"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        sx={{ mb: 1.5 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                    />
                    {loading && <Loading />}
                    {error && (
                        <Alert severity="error" sx={{ mb: 1 }}>
                            {error as any}
                        </Alert>
                    )}
                    {data && (
                        <DataGrid
                            rows={filteredData}
                            columns={COLUMNS}
                            autoHeight
                            density="compact"
                            disableRowSelectionOnClick
                            initialState={{
                                pagination: {
                                    paginationModel: { pageSize: 10, page: 0 },
                                },
                            }}
                            pageSizeOptions={[10, 25, 50]}
                            onRowClick={(p: GridRowParams<Supply>) => {
                                if (!p.row.id) return
                                setSubDetail(
                                    <SupplyDetail
                                        readonly={true}
                                        id={p.row.id as any}
                                        api={api.supplies}
                                        onClose={() => setSubDetail(undefined)}
                                    />,
                                )
                            }}
                            sx={{ '& .MuiDataGrid-row': { cursor: 'pointer' } }}
                        />
                    )}
                </Box>
            }
        />
    )
}
