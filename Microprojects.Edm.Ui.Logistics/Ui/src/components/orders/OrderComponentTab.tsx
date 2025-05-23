import React from 'react';
import PropTypes from 'prop-types';
import { GridColumn } from '@progress/kendo-react-grid';
import {DropDownCell} from "@logistics/components/DropDownCell.tsx";
import {Dictionary, Nomenclature, UUID} from "@logistics/data/types";
import {useGet} from "@logistics/hooks/hooks.ts";
import Api from "@features/api/api.ts";
import {RelationTable} from "@logistics/components/RelationTable.tsx";

type OrderComponentTabProps = {
    id: UUID
    api: string
}

export function OrderComponentTab({ id, api } : OrderComponentTabProps) {
    //const [[noms]] = useGet<Nomenclature>(`${Api.nomenclatures}`)
    return (
        <RelationTable api={`${api}/${id}/items`} creatable editable removable >
            <GridColumn field='nomenclatureCategory' title='Category' width='100' editable={false} />
            <GridColumn field='nomenclatureName' title='Name' width='200' />
            <GridColumn field='nomenclatureDescription' title='Description' width='auto' editable={false}/>
            <GridColumn field='tareTareTypeName' title='Tare' width='auto' />
            <GridColumn field='quantity' title='Quantity' width='auto' />
            <GridColumn field='tareTareTypeUnit' title='Units' width='auto' />
            <GridColumn field='tareBarcode' title='Barcode' width='auto' />
        </RelationTable>
    );
}

