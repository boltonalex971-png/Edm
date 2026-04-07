import React from 'react'
import Api from '@features/api/api'
import { useGet } from '@logistics/hooks/hooks'
import { Grid, GridColumn } from '@progress/kendo-react-grid'
import { Error } from '@progress/kendo-react-labels'
import { Loading } from '@features/utils/Utils'
import { type ItemLinkRow, type UUID } from '@logistics/data/types'
import { EMPTY_GUID } from '@logistics/components/MasterDetail.tsx'

type ItemLinksTableProps = {
    itemId: UUID
}

export function ItemLinksTable({ itemId }: ItemLinksTableProps) {
    if (!itemId || itemId === EMPTY_GUID) {
        return null
    }

    const [[links], loading, error] = useGet<ItemLinkRow[]>(
        `${Api.items}/${itemId}/links`,
        [itemId]
    )

    return (
        <>
            {loading && <Loading />}
            {error && <Error>{error}</Error>}
            {links && (
                <Grid data={links} scrollable='none'>
                    <GridColumn field='sourceNomenclatureName' title='Source nomenclature' />
                    <GridColumn field='sourceTareTypeName' title='Source tare type' />
                    <GridColumn field='sourceTareTypeUnits' title='Source units' />
                    <GridColumn field='sourceTareBarcode' title='Source tare' />
                    <GridColumn field='sourceAddress' title='Source address' />
                    <GridColumn field='consumedQuantity' title='Consumed quantity' />
                    <GridColumn field='targetNomenclatureName' title='Target nomenclature' />
                    <GridColumn field='targetTareBarcode' title='Target tare' />
                    <GridColumn field='targetAddress' title='Target address' />
                </Grid>
            )}
        </>
    )
}

