import { ProcessDetail } from '@logistics/components/config/process/Processes.tsx'
import {
    MANUFACTURING,
    OPERATION,
    TECHNOLOGY,
} from '@logistics/data/processKinds'
import type { ProcessKind, TreeDataItem, UUID } from '@logistics/data/types'
import { GridColumn } from '@progress/kendo-react-grid'
import Api from '../../../features/api/api'
import { useGet } from '../../../hooks/hooks'
import { DropDownTreeCell } from '../../DropDownTreeCell'
import { RelationTable } from '../../RelationTable'

export type ProcessProfilesTabProps = {
    id: UUID
    api: string
    kind?: ProcessKind
    missedInputs: Array<string>
    onDetailSelected: Function
}

export function ProcessSubProcessesTab({
    id,
    api,
    kind,
    onDetailSelected,
}: ProcessProfilesTabProps) {
    const allowedChildKind =
        kind === MANUFACTURING
            ? TECHNOLOGY
            : kind === TECHNOLOGY
              ? OPERATION
              : undefined
    const [[hierarchy]] = useGet<TreeDataItem[]>(
        allowedChildKind
            ? `${api}/hierarchy?kind=${allowedChildKind}`
            : `${api}/hierarchy`,
        [],
    )
    return (
        <RelationTable
            api={`${api}/${id}/subprocesses`}
            removable={true}
            editable={true}
            creatable={!!allowedChildKind}
        >
            <GridColumn width="100" title={'Order'} field={'order'} editable />
            <GridColumn
                editable={false}
                width="200"
                field="linkedProcessId"
                title="Process"
                cell={(cellProps) => (
                    <DropDownTreeCell
                        {...cellProps}
                        getData={() => hierarchy}
                        fieldId="linkedProcessId"
                        fieldName="linkedProcessName"
                        onClick={(procId, itemUpdate) =>
                            onDetailSelected(
                                <ProcessDetail
                                    processId={procId}
                                    api={Api.processes}
                                    onClose={() => onDetailSelected()}
                                    onUpdate={itemUpdate}
                                />,
                            )
                        }
                    />
                )}
            />
            <GridColumn
                field="linkedProcessKind"
                title="Kind"
                editable={false}
            />
            <GridColumn
                field="linkedProcessDescription"
                title="Description"
                editable={false}
            />
        </RelationTable>
    )
}
