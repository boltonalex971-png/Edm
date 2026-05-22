import '@logistics/components/orders' // side-effect: registers the `orders` namespace
import { DateTimeCell } from '@microprojects/edm-components/components/relations/DateTimeCell'
import { RelationTable } from '@logistics/components/RelationTable'
import type { UUID } from '@logistics/data/types'
import { Column as GridColumn } from '@microprojects/edm-components/components'
import { useTranslation } from 'react-i18next'

type OrderOperationTabProps = {
    id: UUID
    api: string
}

export function OrderOperationTab({ id, api }: OrderOperationTabProps) {
    const { t } = useTranslation('orders')
    return (
        <RelationTable api={`${api}/${id}/operations`} readonly>
            <GridColumn field="processName" title={t('operations.column.process', 'Process')} editable={false} />
            <GridColumn field="processNomenclatureName" title={t('operations.column.name', 'Name')} />
            <GridColumn field="startTime" title={t('operations.column.started', 'Started')} cell={DateTimeCell} />
            <GridColumn field="endTime" title={t('operations.column.completed', 'Completed')} cell={DateTimeCell} />
        </RelationTable>
    )
}
