import Api from '@features/api/api'
import { Loading } from '@features/utils/Utils'
import { ItemDetail } from '@logistics/components/items/ItemDetail'
import { Detail } from '@microprojects/edm-components/components'
import '@logistics/components/tare' // side-effect: registers the `tare` namespace
import { TareSchematic } from '@logistics/components/tare/TareSchematic'
import type { Item, TareInfo, UUID } from '@logistics/data/types'
import { useGet } from '@microprojects/edm-components/hooks'
import { useDataGridLocaleText } from '@logistics/i18n/dataGridLocale'
import { WidgetsOutlined as TareIcon } from '@mui/icons-material'
import { Box, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import type React from 'react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

type TareDetailProps = {
    tareId: UUID
    label?: string
    onClose?: () => void
    /** Pre-loaded items scoped to a parent context (order, supply, …). When
     * supplied together with `tare`, TareDetail skips the fetch so its
     * capacity figure matches the parent row's summary instead of summing
     * every physical item in the tare (which double-counts the still-present
     * parent of an allocation split). */
    items?: Item[]
    tare?: TareInfo
    /** Auto-injected by the shared Detail when this component is rendered in
     * the `subDetail` slot — drives the breadcrumb parent chain. */
    parents?: any
}

type ViewMode = 'schema' | 'grid'

export function TareDetail({
    tareId,
    label,
    onClose,
    items: scopedItems,
    tare: scopedTare,
    parents,
}: TareDetailProps) {
    const { t } = useTranslation('tare')
    const dgLocaleText = useDataGridLocaleText()
    const columns = useMemo<GridColDef<Item>[]>(
        () => [
            { field: 'nomenclatureName', headerName: t('detail.column.nomenclature'), flex: 1, minWidth: 160 },
            { field: 'serialNo', headerName: t('detail.column.serialNo'), width: 120 },
            { field: 'address', headerName: t('detail.column.address'), width: 90, type: 'number' },
            { field: 'quantity', headerName: t('detail.column.quantity'), width: 100, type: 'number' },
            { field: 'tareTareTypeUnits', headerName: t('detail.column.units'), width: 80 },
        ],
        [t],
    )
    const skipFetch = scopedItems != null && scopedTare != null
    const [[fetched], fetchLoading, fetchError] = useGet<Item[]>(
        skipFetch ? null : `${Api.items}/tare/${tareId}`,
        [tareId, skipFetch],
    )
    const [view, setView] = useState<ViewMode>('schema')
    const [subDetail, setSubDetail] = useState<React.ReactElement>()

    const openItem = (itemId: UUID) =>
        setSubDetail(
            <ItemDetail
                readonly={true}
                id={itemId}
                api={Api.items}
                type="item"
                onClose={() => setSubDetail(undefined)}
            />,
        )

    const items = scopedItems ?? fetched
    const loading = skipFetch ? false : fetchLoading
    const error = skipFetch ? null : fetchError

    const tare =
        scopedTare ??
        (items?.[0]
            ? {
                  id: tareId,
                  barcode: items[0].tareBarcode,
                  tareTypeId: (items[0].tareTareTypeId || '') as UUID,
                  tareTypeName: items[0].tareTareTypeName,
                  tareTypeUnits: items[0].tareTareTypeUnits,
                  sizeX: items[0].tareTareTypeSizeX,
                  sizeY: items[0].tareTareTypeSizeY,
                  sizeZ: items[0].tareTareTypeSizeZ,
                  dimensions: items[0].tareTareTypeDimensions ?? 0,
                  capacity: items[0].tareTareTypeCapacity ?? 0,
              }
            : undefined)

    const rows = useMemo(
        () => (items ?? []).map((it) => ({ ...it, id: it.id })),
        [items],
    )

    return (
        <Detail
            type="tare"
            parents={parents}
            onClose={onClose}
            icon={<TareIcon />}
            loading={loading}
            error={error as string}
            data={
                {
                    name: label || tare?.barcode || t('detail.fallbackName'),
                    description: tare?.tareTypeName || '',
                } as any
            }
            subDetail={subDetail}
            card={
                <Box>
                    {loading && <Loading />}
                    {tare && items && (
                        <>
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    mb: 1,
                                }}
                            >
                                <ToggleButtonGroup
                                    value={view}
                                    exclusive
                                    size="small"
                                    onChange={(_, v) => v && setView(v)}
                                >
                                    <ToggleButton value="schema">
                                        {t('detail.view.schema')}
                                    </ToggleButton>
                                    <ToggleButton value="grid">
                                        {t('detail.view.grid')}
                                    </ToggleButton>
                                </ToggleButtonGroup>
                            </Box>
                            {view === 'schema' ? (
                                <TareSchematic
                                    tare={tare}
                                    items={items}
                                    onSlotClick={(slot) =>
                                        slot.item && openItem(slot.item.id)
                                    }
                                />
                            ) : (
                                <Box sx={{ width: '100%' }}>
                                    <DataGrid
                                        rows={rows}
                                        columns={columns}
                                        autoHeight
                                        density="compact"
                                        disableRowSelectionOnClick
                                        localeText={dgLocaleText}
                                        hideFooter={rows.length <= 25}
                                        pageSizeOptions={[25, 50, 100]}
                                        onRowClick={(params) =>
                                            openItem(params.row.id)
                                        }
                                        sx={{
                                            '& .MuiDataGrid-row': {
                                                cursor: 'pointer',
                                            },
                                        }}
                                    />
                                </Box>
                            )}
                        </>
                    )}
                    {!loading && items && items.length === 0 && (
                        <Typography
                            sx={{
                                color: 'var(--ink-3)',
                                fontStyle: 'italic',
                            }}
                        >
                            {t('detail.noItems')}
                        </Typography>
                    )}
                </Box>
            }
        />
    )
}
