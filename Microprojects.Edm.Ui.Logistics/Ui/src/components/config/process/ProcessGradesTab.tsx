import type { UUID } from '@logistics/data/types'
import { Column as GridColumn } from '@microprojects/edm-components/components'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { RelationTable } from '../../RelationTable'
import './index' // side-effect: registers the `config/process` namespace

type ProcessGradesTabProps = {
    id: UUID
    api: string
}

export function ProcessGradesTab({ id, api }: ProcessGradesTabProps) {
    const { t } = useTranslation('config/process')
    return (
        <RelationTable api={`${api}/${id}/grades`} removable editable creatable>
            <GridColumn field="name" title={t('grades.name')} width={200} />
            <GridColumn field="description" title={t('grades.description')} width="auto" />
            <GridColumn field="qualifierName" title={t('grades.qualifier')} width={200} />
        </RelationTable>
    )
}
