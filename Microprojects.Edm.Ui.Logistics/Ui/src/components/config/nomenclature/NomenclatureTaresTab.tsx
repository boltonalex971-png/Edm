import Api from '@features/api/api'
import { useGet } from '@logistics/hooks/hooks'
import { Column as GridColumn } from '@microprojects/edm-components/components'
import { useTranslation } from 'react-i18next'
import type { TreeDataItem, UUID } from '../../../data/types'
import { CheckboxCell, DropDownTreeCell } from '@microprojects/edm-components/components'
import { RelationTable } from '../../RelationTable'
import { TareTypeDetail } from '../taretype/TareTypes'
import './index' // side-effect: registers the `config/nomenclature` namespace

type NomenclatureTaresTabProps = {
    id: UUID
    api: string
    onDetailSelected: Function
}

export function NomenclatureTaresTab({
    id,
    api,
    onDetailSelected,
}: NomenclatureTaresTabProps) {
    const { t } = useTranslation('config/nomenclature')
    const [[tareHierarchy]] = useGet<TreeDataItem[]>(
        `${Api.taretypes}/hierarchy`,
        [],
    )
    return (
        <RelationTable
            api={`${api}/${id}/taretypes`}
            removable
            editable
            creatable
        >
            <GridColumn
                field="tareTypeId"
                title={t('taresTab.tareType')}
                width={240}
                cell={(p) => (
                    <DropDownTreeCell
                        {...p}
                        getData={() => tareHierarchy}
                        fieldId="tareTypeId"
                        fieldName="tareTypeName"
                        onClick={(tareId, itemUpdate) =>
                            onDetailSelected(
                                <TareTypeDetail
                                    id={tareId}
                                    type="taretype"
                                    api={Api.taretypes}
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
                field="tareTypeDescription"
                title={t('taresTab.description')}
                width="auto"
                editable={false}
            />
            <GridColumn
                field="isDefault"
                title={t('taresTab.default')}
                width={100}
                cell={(p) => <CheckboxCell {...p} />}
            />
        </RelationTable>
    )
}
