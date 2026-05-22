import Api from '@features/api/api.ts'
import { DropDownTreeCell } from '@microprojects/edm-components/components'
import type { TreeDataItem } from '@logistics/data/types'
import { useGet } from '@logistics/hooks/hooks.ts'
import { Column as GridColumn } from '@microprojects/edm-components/components'
import { useTranslation } from 'react-i18next'
import { RelationTable } from '../../RelationTable'
import './index' // side-effect: registers the `config/process` namespace

type ProcessSpecificationTabProps = {
    id: number
    api: string
}

export function ProcessSpecificationTab({
    id,
    api,
}: ProcessSpecificationTabProps) {
    const { t } = useTranslation('config/process')
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
                title={t('specification.category')}
                width="auto"
                editable={false}
            />
            <GridColumn
                field="nomenclatureId"
                title={t('specification.name')}
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
                title={t('specification.description')}
                width="auto"
                editable={false}
            />
            <GridColumn field="quantity" title={t('specification.quantity')} width="auto" />
        </RelationTable>
    )
}
