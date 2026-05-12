import Api from '@features/api/api.ts'
import { DropDownTreeCell } from '@logistics/components/DropDownTreeCell.tsx'
import type { TreeDataItem } from '@logistics/data/types'
import { useGet } from '@logistics/hooks/hooks.ts'
import { Column as GridColumn } from '@microprojects/edm-components/components'
import { RelationTable } from '../../RelationTable'

type ProcessSpecificationTabProps = {
    id: number
    api: string
}

export function ProcessSpecificationTab({
    id,
    api,
}: ProcessSpecificationTabProps) {
    const [[noms]] = useGet<TreeDataItem[]>(
        `${Api.nomenclatures}/hierarchy`,
        [],
    )
    return (
        <RelationTable
            api={`${api}/${id}/specification`}
            removable
            editable
            creatable
        >
            <GridColumn
                field="nomenclatureCategory"
                title="Category"
                width="auto"
                editable={false}
            />
            <GridColumn
                field="nomenclatureId"
                title="Name"
                width={200}
                cell={(p) => (
                    <DropDownTreeCell
                        {...p}
                        getData={() => noms}
                        fieldId="nomenclatureId"
                        fieldName="nomenclatureName"
                    />
                )}
            />
            <GridColumn
                field="nomenclatureDescription"
                title="Description"
                width="auto"
                editable={false}
            />
            <GridColumn field="quantity" title="Quantity" width="auto" />
        </RelationTable>
    )
}
