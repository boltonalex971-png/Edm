import Api from '@features/api/api'
import { Loading } from '@features/utils/Utils'
import { Detail } from '@logistics/components/MasterDetail'
import { TareSchematic } from '@logistics/components/tare/TareSchematic'
import type { Item, TareInfo, UUID } from '@logistics/data/types'
import { useGet } from '@logistics/hooks/hooks'
import { Button, ButtonGroup } from '@progress/kendo-react-buttons'
import { Grid, GridColumn } from '@progress/kendo-react-grid'
import React, { useState } from 'react'
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

    return (
        <Detail
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
                <>
                    {loading && <Loading />}
                    {tare && items && (
                        <>
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    marginBottom: '0.5rem',
                                }}
                            >
                                <ButtonGroup>
                                    <Button
                                        togglable
                                        selected={view === 'schema'}
                                        onClick={() => setView('schema')}
                                        size="small"
                                    >
                                        Schema
                                    </Button>
                                    <Button
                                        togglable
                                        selected={view === 'grid'}
                                        onClick={() => setView('grid')}
                                        size="small"
                                    >
                                        Grid
                                    </Button>
                                </ButtonGroup>
                            </div>
                            {view === 'schema' ? (
                                <TareSchematic tare={tare} items={items} />
                            ) : (
                                <Grid data={items} scrollable="none">
                                    <GridColumn
                                        field="nomenclatureName"
                                        title="Nomenclature"
                                    />
                                    <GridColumn
                                        field="serialNo"
                                        title="Serial No"
                                        width="120"
                                    />
                                    <GridColumn
                                        field="address"
                                        title="Address"
                                        width="80"
                                    />
                                    <GridColumn
                                        field="quantity"
                                        title="Quantity"
                                        width="90"
                                    />
                                    <GridColumn
                                        field="tareTareTypeUnits"
                                        title="Units"
                                        width="80"
                                    />
                                </Grid>
                            )}
                        </>
                    )}
                    {!loading && items && items.length === 0 && (
                        <div style={{ color: '#999', fontStyle: 'italic' }}>
                            No items in this tare
                        </div>
                    )}
                </>
            }
        />
    )
}
