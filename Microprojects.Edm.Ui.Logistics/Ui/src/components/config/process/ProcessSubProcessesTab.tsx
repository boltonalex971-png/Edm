import { ProcessDetail } from '@logistics/components/config/process/Processes.tsx'
import {
    MANUFACTURING,
    OPERATION,
    TECHNOLOGY,
} from '@logistics/data/processKinds'
import type { ProcessKind, UUID } from '@logistics/data/types'
import { GridColumn } from '@progress/kendo-react-grid'
import React from 'react'
import Api from '../../../features/api/api'
import { useGet } from '../../../hooks/hooks'
import { DropDownCell, LinkTextCell } from '../../DropDownCell'
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
    missedInputs,
    onDetailSelected,
}: ProcessProfilesTabProps) {
    const allowedChildKind =
        kind === MANUFACTURING
            ? TECHNOLOGY
            : kind === TECHNOLOGY
              ? OPERATION
              : undefined
    const [[data]] = useGet(
        allowedChildKind ? `${api}?kind=${allowedChildKind}` : `${api}`,
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
                cell={(cellProps) =>
                    data && (
                        <DropDownCell
                            {...cellProps}
                            getData={() => data}
                            id="id"
                            text="name"
                            fieldId={cellProps.field || 'id'}
                            onClick={(id, itemUpdate) =>
                                onDetailSelected(
                                    <ProcessDetail
                                        processId={id}
                                        api={Api.processes}
                                        onClose={() => onDetailSelected()}
                                        onUpdate={itemUpdate}
                                    />,
                                )
                            }
                        />
                    )
                }
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
