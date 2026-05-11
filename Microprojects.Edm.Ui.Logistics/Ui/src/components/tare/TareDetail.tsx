import Api from '@features/api/api'
import { Loading } from '@features/utils/Utils'
import { Detail } from '@logistics/components/MasterDetail'
import { TareSchematic } from '@logistics/components/tare/TareSchematic'
import type { Item, TareInfo, UUID } from '@logistics/data/types'
import { useGet } from '@logistics/hooks/hooks'
import { Box, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import { useMemo, useState } from 'react'
import { Diagram3 } from 'react-bootstrap-icons'

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
}

type ViewMode = 'schema' | 'grid'

const COLUMNS: GridColDef<Item>[] = [
    { field: 'nomenclatureName', headerName: 'Nomenclature', flex: 1, minWidth: 160 },
    { field: 'serialNo', headerName: 'Serial No', width: 120 },
    { field: 'address', headerName: 'Address', width: 90, type: 'number' },
    { field: 'quantity', headerName: 'Quantity', width: 100, type: 'number' },
    { field: 'tareTareTypeUnits', headerName: 'Units', width: 80 },
]

export function TareDetail({
    tareId,
    label,
    onClose,
    items: scopedItems,
    tare: scopedTare,
}: TareDetailProps) {
    const skipFetch = scopedItems != null && scopedTare != null
    const [[fetched], fetchLoading, fetchError] = useGet<Item[]>(
        skipFetch ? null : `${Api.items}/tare/${tareId}`,
        [tareId, skipFetch],
    )
    const [view, setView] = useState<ViewMode>('schema')

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
            onClose={onClose}
            icon={<Diagram3 title="Tare" />}
            loading={loading}
            error={error as string}
            data={
                {
                    name: label || tare?.barcode || 'Tare',
                    description: tare?.tareTypeName || '',
                } as any
            }
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
                                        Schema
                                    </ToggleButton>
                                    <ToggleButton value="grid">
                                        Grid
                                    </ToggleButton>
                                </ToggleButtonGroup>
                            </Box>
                            {view === 'schema' ? (
                                <TareSchematic tare={tare} items={items} />
                            ) : (
                                <Box sx={{ width: '100%' }}>
                                    <DataGrid
                                        rows={rows}
                                        columns={COLUMNS}
                                        autoHeight
                                        density="compact"
                                        disableRowSelectionOnClick
                                        hideFooter={rows.length <= 25}
                                        pageSizeOptions={[25, 50, 100]}
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
                            No items in this tare
                        </Typography>
                    )}
                </Box>
            }
        />
    )
}
