import Api from '@features/api/api'
import { useGet } from '@logistics/hooks/hooks'
import { Column as GridColumn } from '@microprojects/edm-components/components'
import type { TreeDataItem, UUID } from '../../../data/types'
import { CheckboxCell } from '../../CheckboxCell'
import { DropDownTreeCell } from '../../DropDownTreeCell'
import { RelationTable } from '../../RelationTable'
import { TareTypeDetail } from '../taretype/TareTypes'

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
                title="Tare type"
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
                title="Description"
                width="auto"
                editable={false}
            />
            <GridColumn
                field="isDefault"
                title="Default"
                width={100}
                cell={(p) => <CheckboxCell {...p} />}
            />
        </RelationTable>
    )
}
