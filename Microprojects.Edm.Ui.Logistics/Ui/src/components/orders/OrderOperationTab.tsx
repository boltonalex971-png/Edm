import {
    DateTimeCell,
    RelationTable,
} from '@logistics/components/RelationTable.tsx'
import type { UUID } from '@logistics/data/types'
import { Column as GridColumn } from '@microprojects/edm-components/components'

type OrderOperationTabProps = {
    id: UUID
    api: string
}

export function OrderOperationTab({ id, api }: OrderOperationTabProps) {
    return (
        <RelationTable api={`${api}/${id}/operations`}>
            <GridColumn field="processName" title="Process" editable={false} />
            <GridColumn field="processNomenclatureName" title="Name" />
            <GridColumn field="startTime" title="Started" cell={DateTimeCell} />
            <GridColumn field="endTime" title="Completed" cell={DateTimeCell} />
        </RelationTable>
    )
}
