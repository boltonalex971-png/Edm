import '@logistics/components/orders' // side-effect: registers the `orders` namespace
import { type AlertState, useAlertSetter } from '@logistics/components/InlineAlert'
import { RelationTable } from '@logistics/components/RelationTable.tsx'
import { ItemSearch } from '@logistics/components/items/ItemSearch.tsx'
import type { AllocateItemsRequest, Item, UUID } from '@logistics/data/types'
import { formatQuantity, formatUnits } from '@logistics/utils/format'
import { FormControlLabel, Switch } from '@mui/material'
import { Column as GridColumn } from '@microprojects/edm-components/components'
import axios from 'axios'
import { useTranslation } from 'react-i18next'

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
    const setAlert = useAlertSetter()
    const { t } = useTranslation('orders')
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
                    t('specification.allocated', '{{quantity}} allocated', { quantity: qtyTxt }) +
                    (stoppedReason
                        ? `. ${t('specification.stopped', 'Stopped: {{reason}}', { reason: stoppedReason })}`
                        : '')
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
    const rowSelected = (item: any, update: (item: any) => void) => {
        const amount = Number(item?.amount ?? 0)
        const total = Number(item?.total ?? 0)
        if (amount > 0 && total >= amount) {
            setAlert({
                message: t('specification.alreadyAllocated', '{{name}} is already fully allocated', {
                    name: item?.nomenclatureName ?? t('specification.componentFallback', 'Component'),
                }),
                status: 'warning',
            })
            return
        }
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
        <RelationTable
            api={`${api}/${id}/specification`}
            onRowSelected={rowSelected}
            readonly
            toolbarEnd={
                <FormControlLabel
                    control={<Switch size="small" disabled />}
                    label={t('specification.hideAllocated', 'Hide totally allocated components')}
                    sx={{
                        m: 0,
                        '& .MuiFormControlLabel-label': { fontSize: 13 },
                    }}
                />
            }
        >
            <GridColumn
                field="nomenclatureCategory"
                title={t('specification.column.category', 'Category')}
                width="100"
                editable={false}
            />
            <GridColumn
                field="nomenclatureName"
                title={t('specification.column.name', 'Name')}
                width="auto"
            />
            <GridColumn
                field="nomenclatureDescription"
                title={t('specification.column.description', 'Description')}
                width="auto"
                editable={false}
            />
            <GridColumn
                field="amount"
                title={t('specification.column.required', 'Required')}
                width="100"
                cell={(p) =>
                    formatQuantity(
                        p.dataItem.amount,
                        p.dataItem.nomenclatureCountable,
                    )
                }
            />
            <GridColumn
                field="total"
                title={t('specification.column.allocated', 'Allocated')}
                width="100"
                cell={(p) =>
                    formatQuantity(
                        p.dataItem.total,
                        p.dataItem.nomenclatureCountable,
                    )
                }
            />
        </RelationTable>
    )
}
