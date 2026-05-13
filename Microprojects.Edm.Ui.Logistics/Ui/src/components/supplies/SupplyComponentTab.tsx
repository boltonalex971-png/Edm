import Api from '@features/api/api'
import { RelationTable } from '@logistics/components/RelationTable'
import { BatchItemCreate } from '@logistics/components/items/BatchItemCreate'
import { ItemDetail } from '@logistics/components/items/ItemDetail'
import type { UUID } from '@logistics/data/types'
import { Column as GridColumn } from '@microprojects/edm-components/components'
import { AddOutlined as AddIcon } from '@mui/icons-material'
import { Button as MuiButton } from '@mui/material'

type SupplyComponentTabProps = {
    id: UUID
    api: string
    onDetailSelected?: Function
}

export function SupplyComponentTab({
    id,
    api,
    onDetailSelected,
}: SupplyComponentTabProps) {
    return (
        <RelationTable
            api={`${api}/${id}/items`}
            readonly
            onRowSelected={(row) =>
                onDetailSelected?.(
                    <ItemDetail
                        readonly={true}
                        id={row.id}
                        api={Api.items}
                        type="item"
                        onClose={() => onDetailSelected?.(undefined)}
                    />,
                )
            }
            toolbarEnd={
                <MuiButton
                    variant="contained"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() =>
                        onDetailSelected?.(
                            <BatchItemCreate
                                supplyId={id}
                                onClose={() => onDetailSelected?.(undefined)}
                            />,
                        )
                    }
                >
                    Add items
                </MuiButton>
            }
        >
            <GridColumn field="nomenclatureName" title="Nomenclature" />
            <GridColumn field="serialNo" title="Serial No" width="120" />
            <GridColumn field="quantity" title="Quantity" width="100" />
            <GridColumn field="tareBarcode" title="Tare" width="140" />
            <GridColumn
                field="tareTareTypeName"
                title="Tare Type"
                width="160"
            />
        </RelationTable>
    )
}
