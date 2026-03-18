import React from 'react'
import {GridColumn} from '@progress/kendo-react-grid'
import {RelationTable} from '../../RelationTable'
import {UUID} from '@logistics/data/types'

type ProcessGradesTabProps = {
    id: UUID
    api: string
}

export function ProcessGradesTab({id, api}: ProcessGradesTabProps) {
    return (
        <RelationTable api={`${api}/${id}/grades`} removable editable creatable>
            <GridColumn field='name' title='Name' width={200}/>
            <GridColumn field='description' title='Description' width='auto'/>
            <GridColumn field='qualifierName' title='Qualifier' width={200}/>
        </RelationTable>
    )
}

