import { ProcessDetail } from '@logistics/components/config/process/Processes.tsx'
import {
    MANUFACTURING,
    OPERATION,
    TECHNOLOGY,
} from '@logistics/data/processKinds'
import type { ProcessKind, TreeDataItem, UUID } from '@logistics/data/types'
import { Column as GridColumn } from '@microprojects/edm-components/components'
import { Button } from '@mui/material'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Api from '../../../features/api/api'
import { useGet } from '@microprojects/edm-components/hooks'
import { DropDownTreeCell } from '@microprojects/edm-components/components'
import { RelationTable } from '@microprojects/edm-components/components'
import { LinkTechProcessDialog } from './LinkTechProcessDialog'
import './index' // side-effect: registers the `config/process` namespace

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
    const { t } = useTranslation('config/process')
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
    const [linkOpen, setLinkOpen] = useState(false)
    const [refreshKey, setRefreshKey] = useState(0)
    return (
        <RelationTable
            key={refreshKey}
            api={`${api}/${id}/subprocesses`}
            removable={true}
            editable={true}
            creatable={!!allowedChildKind}
            toolbarEnd={
                kind === TECHNOLOGY ? (
                    <>
                        <Button
                            size="small"
                            variant="outlined"
                            onClick={() => setLinkOpen(true)}
                        >
                            {t('linkTech.action')}
                        </Button>
                        {linkOpen && (
                            <LinkTechProcessDialog
                                open={linkOpen}
                                technologyProcessId={id}
                                onClose={() => setLinkOpen(false)}
                                onLinked={() => setRefreshKey((k) => k + 1)}
                            />
                        )}
                    </>
                ) : undefined
            }
        >
            <GridColumn width="100" title={t('subprocesses.order')} field={'order'} editable />
            <GridColumn
                editable={false}
                width="200"
                field="linkedProcessId"
                title={t('subprocesses.process')}
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
                title={t('subprocesses.kind')}
                editable={false}
            />
            <GridColumn
                field="linkedProcessDescription"
                title={t('subprocesses.description')}
                editable={false}
            />
        </RelationTable>
    )
}
