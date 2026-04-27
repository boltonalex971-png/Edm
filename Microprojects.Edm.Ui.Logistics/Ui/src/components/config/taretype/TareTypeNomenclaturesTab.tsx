import Api from '@features/api/api'
import { useGet } from '@logistics/hooks/hooks'
import { GridColumn } from '@progress/kendo-react-grid'
import type { TreeDataItem, UUID } from '../../../data/types'
import { CheckboxCell } from '../../CheckboxCell'
import { DropDownTreeCell } from '../../DropDownTreeCell'
import { RelationTable } from '../../RelationTable'
import { NomenclatureDetail } from '../nomenclature/Nomenclatures'

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
                title="Nomenclature"
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
                title="Category"
                width={140}
                editable={false}
            />
            <GridColumn
                field="nomenclatureDescription"
                title="Description"
                width="auto"
                editable={false}
            />
            <GridColumn
                field="isDefault"
                title="Default"
                width={100}
                cell={(p) => <CheckboxCell {...p} editable={false} />}
            />
        </RelationTable>
    )
}
