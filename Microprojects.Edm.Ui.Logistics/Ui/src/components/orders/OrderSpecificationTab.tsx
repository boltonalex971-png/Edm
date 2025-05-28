import React, {useContext} from 'react';
import PropTypes from 'prop-types';
import {GridColumn} from '@progress/kendo-react-grid';
import {DropDownCell} from "@logistics/components/DropDownCell.tsx";
import {Dictionary, Item, Nomenclature, UUID} from "@logistics/data/types";
import {useGet, usePost} from "@logistics/hooks/hooks.ts";
import Api from "@features/api/api.ts";
import {RelationTable} from "@logistics/components/RelationTable.tsx";
import {ProcessDetail} from "@logistics/components/config/process/Processes.tsx";
import {AlertState, ItemSearch} from "@logistics/components/items/ItemSearch.tsx";
import axios from "axios";
import {Switch} from "@progress/kendo-react-inputs";
import {Alert} from "reactstrap";
import {ParentContext} from "@logistics/components/ParentContext.ts";

type OrderSpecificationTabProps = {
    id: UUID
    api: string
    onDetailSelected: Function

}

export function OrderSpecificationTab({id, api, onDetailSelected}: OrderSpecificationTabProps) {
    const addComponent = (item: Item, itemUpdate : (item : any) => void, setAlert: (message : AlertState) => void) => {
        axios.post(`${api}/${id}/items`, item)
            .then(result => {
                setAlert({message: `${result.data.quantity} allocated`,  status: undefined})
                itemUpdate(result.data)
            }).catch(e => setAlert({message: e.response.data.detail,  status: 'danger'}))
    }
    const rowSelected = (item: Item, update: (item: any) => void) => {
        onDetailSelected && onDetailSelected(
            <ItemSearch
                onClose={() => onDetailSelected(undefined)}
                query={{nomenclatureId: item.nomenclatureId}}
                lookup={true}
                selected={(item, setAlert) => addComponent(item, update, setAlert)}
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

