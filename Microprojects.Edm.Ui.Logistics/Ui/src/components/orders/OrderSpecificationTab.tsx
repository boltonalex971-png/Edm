import type { AlertState } from '@logistics/components/InlineAlert'
import { RelationTable } from '@logistics/components/RelationTable.tsx'
import { ItemSearch } from '@logistics/components/items/ItemSearch.tsx'
import type { AllocateItemsRequest, Item, UUID } from '@logistics/data/types'
import { formatUnits } from '@logistics/utils/format'
import { Box, FormControlLabel, Switch } from '@mui/material'
import { Column as GridColumn } from '@microprojects/edm-components/components'
import axios from 'axios'

type OrderSpecificationTabProps = {
    id: UUID
    api: string
    onDetailSelected: Function
}

export function OrderSpecificationTab({
    id,
    api,
    onDetailSelected,
}: OrderSpecificationTabProps) {
    const addComponents = (
        items: Item[],
        itemUpdate: (item: any) => void,
        setAlert: (message: AlertState) => void,
        onDone: () => void,
    ) => {
        const request: AllocateItemsRequest = {
            itemIds: items.map((i) => i.id),
        }
        axios
            .post(`${api}/${id}/items/batch`, request)
            .then((result) => {
                const { allocatedQuantity, units, countable, stoppedReason } =
                    result.data
                const qtyTxt = formatUnits(allocatedQuantity, units, countable)
                const msg =
                    `${qtyTxt} allocated` +
                    (stoppedReason ? `. Stopped: ${stoppedReason}` : '')
                setAlert({
                    message: msg,
                    status: stoppedReason ? 'warning' : undefined,
                })
                itemUpdate(result.data)
                onDone()
            })
            .catch((e) => {
                setAlert({ message: e.response.data.detail, status: 'danger' })
                onDone()
            })
    }
    const rowSelected = (item: Item, update: (item: any) => void) => {
        onDetailSelected &&
            onDetailSelected(
                <ItemSearch
                    onClose={() => onDetailSelected(undefined)}
                    query={{ nomenclatureId: item.nomenclatureId }}
                    lookup={true}
                    selected={(items, setAlert, onDone) =>
                        addComponents(items, update, setAlert, onDone)
                    }
                />,
            )
    }
    return (
        <>
            <Box
                sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}
            >
                <FormControlLabel
                    control={<Switch size="small" disabled />}
                    label="Hide totally allocated components"
                    sx={{ '& .MuiFormControlLabel-label': { fontSize: 13 } }}
                />
            </Box>
            <RelationTable
                api={`${api}/${id}/specification`}
                onRowSelected={rowSelected}
            >
                <GridColumn
                    field="nomenclatureCategory"
                    title="Category"
                    width="100"
                    editable={false}
                />
                <GridColumn
                    field="nomenclatureName"
                    title="Name"
                    width="auto"
                />
                <GridColumn
                    field="nomenclatureDescription"
                    title="Description"
                    width="auto"
                    editable={false}
                />
                <GridColumn field="amount" title="Required" width="100" />
                <GridColumn field="total" title="Allocated" width="100" />
            </RelationTable>
        </>
    )
}
