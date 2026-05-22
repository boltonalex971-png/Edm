import '@logistics/components/orders' // side-effect: registers the `orders` namespace
import api from '@features/api/api.ts'
import Api from '@features/api/api.ts'
import { Loading } from '@features/utils/Utils'
import { DetailLinkText } from '@microprojects/edm-components/components'
import { Detail } from '@logistics/components/MasterDetail'
import { NomenclatureDetail } from '@logistics/components/config/nomenclature/Nomenclatures'
import { ProcessDetail } from '@logistics/components/config/process/Processes'
import { OrderDetail } from '@logistics/components/orders/OrderDetail'
import {
    type DataItem,
    type ItemSearchQuery,
    type Order,
} from '@logistics/data/types'
import {
    type EntityTag,
    listTag,
    useEntityToken,
} from '@microprojects/edm-components/hooks'
import { usePost } from '@microprojects/edm-components/hooks'
import { useDataGridLocaleText } from '@logistics/i18n/dataGridLocale'
import { formatLocalDate } from '@microprojects/edm-components/utils/dates'
import { Search as SearchIcon } from '@mui/icons-material'
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
import {
    type ReactElement,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import { useTranslation } from 'react-i18next'

type OrderSearchProps = {
    query?: ItemSearchQuery
}

export const OrderSearch = (props: OrderSearchProps) => {
    const { t } = useTranslation('orders')
    const dgLocaleText = useDataGridLocaleText()
    // Two-tier subscription: list-tag for membership changes
    // (create/delete/complete) plus per-id tokens for orders currently in
    // the list. Edits to off-list orders fire only the broad `{type:'order'}`
    // tag, which we do NOT subscribe to — so they don't trigger a refetch.
    const [orders, setOrders] = useState<Order[]>()
    const subscribedTags = useMemo<EntityTag[]>(
        () => [
            listTag('order'),
            ...(orders ?? []).map((o) => ({
                type: 'order',
                id: o.id as string,
            })),
        ],
        [orders],
    )
    const fingerprint = useMemo(
        () =>
            subscribedTags
                .map((tag) => (tag.id ? `${tag.type}:${tag.id}` : tag.type))
                .sort()
                .join('|'),
        [subscribedTags],
    )
    const rawToken = useEntityToken(subscribedTags)

    // Re-baseline silently when the subscribed set changes (orders arrive or
    // depart) so the refetch counter only bumps for actual invalidations to
    // already-subscribed tags — not for the artificial token jump that
    // happens when a newly-added id has a non-zero counter.
    const baselineRef = useRef({ fingerprint, token: rawToken })
    const [refreshCounter, setRefreshCounter] = useState(0)
    useEffect(() => {
        if (baselineRef.current.fingerprint !== fingerprint) {
            baselineRef.current = { fingerprint, token: rawToken }
            return
        }
        if (rawToken !== baselineRef.current.token) {
            baselineRef.current.token = rawToken
            setRefreshCounter((c) => c + 1)
        }
    }, [fingerprint, rawToken])

    const [[fetchedOrders], loading, error] = usePost<Order[]>(
        `${api.orders}/search`,
        props.query || {},
        [props.query?.nomenclatureId, props.query?.active, refreshCounter],
    )
    useEffect(() => {
        if (fetchedOrders) setOrders(fetchedOrders)
    }, [fetchedOrders])

    const [subDetail, setSubDetail] = useState<ReactElement | undefined>()
    const [filter, setFilter] = useState<string>('')

    const filteredData = useMemo(() => {
        const lc = filter.toLowerCase()
        return (
            orders?.filter(
                (o) =>
                    o.number?.toLowerCase().includes(lc) ||
                    o.processName?.toLowerCase().includes(lc) ||
                    o.processNomenclatureName?.toLowerCase().includes(lc) ||
                    o.description?.toLowerCase().includes(lc),
            ) ?? []
        )
    }, [filter, orders])

    const columns: GridColDef<Order>[] = useMemo(
        () => [
            { field: 'number', headerName: t('search.column.orderNumber', 'Order #'), width: 110 },
            {
                field: 'processName',
                headerName: t('search.column.process', 'Process'),
                flex: 1,
                minWidth: 160,
                renderCell: (p) => (
                    <DetailLinkText
                        id={p.row.processId}
                        text={p.row.processName ?? ''}
                        onClick={(id) =>
                            setSubDetail(
                                <ProcessDetail
                                    processId={id}
                                    api={Api.processes}
                                    onClose={() => setSubDetail(undefined)}
                                />,
                            )
                        }
                    />
                ),
            },
            {
                field: 'processNomenclatureName',
                headerName: t('search.column.nomenclature', 'Nomenclature'),
                flex: 1,
                minWidth: 160,
                renderCell: (p) => (
                    <DetailLinkText
                        id={p.row.processNomenclatureId}
                        text={p.row.processNomenclatureName ?? ''}
                        onClick={(id) =>
                            setSubDetail(
                                <NomenclatureDetail
                                    id={id}
                                    api={Api.nomenclatures}
                                    onClose={() => setSubDetail(undefined)}
                                />,
                            )
                        }
                    />
                ),
            },
            { field: 'amount', headerName: t('search.column.amount', 'Amount'), width: 90, type: 'number' },
            { field: 'description', headerName: t('search.column.description', 'Description'), flex: 1, minWidth: 140 },
            {
                field: 'startDate',
                headerName: t('search.column.start', 'Start'),
                width: 110,
                renderCell: (p) => formatLocalDate(p.value as any),
            },
            {
                field: 'dueDate',
                headerName: t('search.column.due', 'Due'),
                width: 110,
                renderCell: (p) => formatLocalDate(p.value as any),
            },
            {
                field: 'status',
                headerName: t('search.column.status', 'Status'),
                width: 140,
                renderCell: (p) =>
                    p.value ? t(`widgets:status.${p.value as string}`) : '',
            },
            { field: 'executor', headerName: t('search.column.executor', 'Executor'), width: 160 },
        ],
        [t],
    )

    return (
        <Detail
            type="order"
            icon={<SearchIcon />}
            loading={loading}
            error={error as string}
            data={
                {
                    name: t('search.title', 'Order search'),
                    description: t('search.description', 'Search for orders'),
                } as DataItem
            }
            subDetail={subDetail}
            card={
                <Box>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder={t('search.placeholder', 'Search by number, process or nomenclature')}
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
                            {error as string}
                        </Alert>
                    )}
                    {orders && (
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
                            onRowClick={(p: GridRowParams<Order>) =>
                                setSubDetail(
                                    <OrderDetail
                                        id={p.row.id as any}
                                        type="order"
                                        api={Api.orders}
                                        onClose={() => setSubDetail(undefined)}
                                    />,
                                )
                            }
                            sx={{
                                '& .MuiDataGrid-row': { cursor: 'pointer' },
                            }}
                        />
                    )}
                </Box>
            }
        />
    )
}
