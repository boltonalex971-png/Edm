import Api from '@features/api/api'
import { useGet } from '@microprojects/edm-components/hooks'
import { Column as GridColumn } from '@microprojects/edm-components/components'
import { useTranslation } from 'react-i18next'
import type { TreeDataItem, UUID } from '../../../data/types'
import { CheckboxCell, DropDownTreeCell } from '@microprojects/edm-components/components'
import { RelationTable } from '@microprojects/edm-components/components'
import { NomenclatureDetail } from '../nomenclature/Nomenclatures'
import './index' // side-effect: registers the `config/taretype` namespace

type TareTypeNomenclaturesTabProps = {
    id: UUID
    api: string
    onDetailSelected: Function
}

export function TareTypeNomenclaturesTab({
    id,
    api,
    onDetailSelected,
}: TareTypeNomenclaturesTabProps) {
    const { t } = useTranslation('config/taretype')
    const [[nomenclatureHierarchy]] = useGet<TreeDataItem[]>(
        `${Api.nomenclatures}/hierarchy`,
        [],
    )
    return (
        <RelationTable
            api={`${api}/${id}/nomenclatures`}
            removable
            editable={false}
            creatable
        >
            <GridColumn
                field="nomenclatureId"
                title={t('nomenclaturesTab.nomenclature')}
                width={240}
                cell={(p) => (
                    <DropDownTreeCell
                        {...p}
                        getData={() => nomenclatureHierarchy}
                        fieldId="nomenclatureId"
                        fieldName="nomenclatureName"
                        onClick={(nomId, itemUpdate) =>
                            onDetailSelected(
                                <NomenclatureDetail
                                    id={nomId}
                                    type="nomenclature"
                                    api={Api.nomenclatures}
                                    path=""
                                    onClose={() => onDetailSelected()}
                                    onUpdate={itemUpdate}
                                />,
                            )
                        }
                    />
                )}
            />
            <GridColumn
                field="nomenclatureCategory"
                title={t('nomenclaturesTab.category')}
                width={140}
                editable={false}
            />
            <GridColumn
                field="nomenclatureDescription"
                title={t('nomenclaturesTab.description')}
                width="auto"
                editable={false}
            />
            <GridColumn
                field="isDefault"
                title={t('nomenclaturesTab.default')}
                width={100}
                cell={(p) => <CheckboxCell {...p} editable={false} />}
            />
        </RelationTable>
    )
}
