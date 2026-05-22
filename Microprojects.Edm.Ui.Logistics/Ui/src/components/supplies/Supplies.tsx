import api from '@features/api/api'
import { Loading } from '@features/utils/Utils.tsx'
import { Detail } from '@microprojects/edm-components/components'
import '@logistics/components/supplies' // side-effect: registers the `supplies` namespace
import { SupplyDetail } from '@logistics/components/supplies/SupplyDetail'
import type { Supply } from '@logistics/data/types'
import { useGet } from '@microprojects/edm-components/hooks'
import { useDataGridLocaleText } from '@logistics/i18n/dataGridLocale'
import { formatLocalDateTime } from '@microprojects/edm-components/utils/dates'
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
import { useTranslation } from 'react-i18next'

export function Supplies() {
    const path = useBasePath()
    const { t } = useTranslation('supplies')

    const menuItems = [
        { label: t('page.menu.remains'), path: `${path}/remaining`, icon: <RemainsIcon fontSize="small" /> },
        { label: t('page.menu.consumed'), path: `${path}/consumed`, icon: <ConsumedIcon fontSize="small" /> },
    ]

    return (
        <SubRootPage title={t('page.title')} menuItems={menuItems}>
            <Search
                actions={[
                    {
                        key: 'search',
                        label: t('actions.search'),
                        icon: <SearchIcon fontSize="small" />,
                        panel: <SupplySearch />,
                    },
                    {
                        key: 'create',
                        label: t('actions.createNew'),
                        icon: <AddIcon fontSize="small" />,
                        panel: (
                            <SupplyDetail
                                title={t('detail.newTitle')}
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

function useColumns(): GridColDef<Supply>[] {
    const { t } = useTranslation('supplies')
    return useMemo(
        () => [
            { field: 'barcode', headerName: t('field.barcode'), flex: 1, minWidth: 140 },
            { field: 'shipment', headerName: t('field.shipment'), flex: 1, minWidth: 140 },
            { field: 'shipmentExternalId', headerName: t('field.shipmentExternalId'), flex: 1, minWidth: 140 },
            {
                field: 'metaCreated',
                headerName: t('field.created'),
                flex: 1,
                minWidth: 160,
                renderCell: (p) => formatLocalDateTime(p.value as any),
            },
        ],
        [t],
    )
}

function SupplySearch() {
    const { t } = useTranslation('supplies')
    const dgLocaleText = useDataGridLocaleText()
    const columns = useColumns()
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
                    name: t('search.name'),
                    description: t('search.description'),
                } as any
            }
            subDetail={subDetail}
            card={
                <Box>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder={t('search.placeholder')}
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
                            columns={columns}
                            autoHeight
                            density="compact"
                            disableRowSelectionOnClick
                            localeText={dgLocaleText}
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
