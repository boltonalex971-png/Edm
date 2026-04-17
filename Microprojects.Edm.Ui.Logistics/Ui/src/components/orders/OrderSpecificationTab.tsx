import React from 'react'
import {GridColumn} from '@progress/kendo-react-grid'
import type {AllocateItemsRequest, Item, UUID} from '@logistics/data/types'
import {RelationTable} from '@logistics/components/RelationTable.tsx'
import type {AlertState} from '@logistics/components/InlineAlert'
import {ItemSearch} from '@logistics/components/items/ItemSearch.tsx'
import axios from 'axios'
import {Switch} from '@progress/kendo-react-inputs'

type OrderSpecificationTabProps = {
    id: UUID
    api: string
    onDetailSelected: Function

}

export function OrderSpecificationTab({id, api, onDetailSelected}: OrderSpecificationTabProps) {
    const addComponents = (items: Item[], itemUpdate: (item: any) => void, setAlert: (message: AlertState) => void, onDone: () => void) => {
        const request: AllocateItemsRequest = {itemIds: items.map(i => i.id)}
        axios.post(`${api}/${id}/items/batch`, request)
            .then(result => {
                const {allocatedCount, allocatedQuantity, stoppedReason} = result.data
                const msg = `${allocatedCount} item(s) allocated (${allocatedQuantity} qty)`
                    + (stoppedReason ? `. Stopped: ${stoppedReason}` : '')
                setAlert({
                    message: msg,
                    status: stoppedReason ? 'warning' : undefined,
                })
                itemUpdate(result.data)
                onDone()
            })
            .catch(e => {
                setAlert({message: e.response.data.detail, status: 'danger'})
                onDone()
            })
    }
    const rowSelected = (item: Item, update: (item: any) => void) => {
        onDetailSelected && onDetailSelected(
            <ItemSearch
                onClose={() => onDetailSelected(undefined)}
                query={{nomenclatureId: item.nomenclatureId}}
                lookup={true}
                selected={(items, setAlert, onDone) => addComponents(items, update, setAlert, onDone)}
            />) 
    }
    return (
        <>
            <div className={'mb-2'} style={{display:'flex', justifyContent: 'end'}}>
                <span><Switch defaultChecked={false} size='small' disabled/> Hide totally allocated components </span>
            </div>
            <RelationTable
                api={`${api}/${id}/specification`}
                onRowSelected={rowSelected}
            >
                <GridColumn field='nomenclatureCategory' title='Category' width='100' editable={false}/>
                <GridColumn field='nomenclatureName' title='Name' width='auto'/>
                <GridColumn field='nomenclatureDescription' title='Description' width='auto' editable={false}/>
                <GridColumn field='amount' title='Required' width='100'/>
                <GridColumn field='total' title='Allocated' width='100'/>
            </RelationTable>
        </>
    );
}

