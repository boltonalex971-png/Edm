import React from 'react';
import PropTypes from 'prop-types';
import { GridColumn } from '@progress/kendo-react-grid';
import {DropDownCell} from "@logistics/components/DropDownCell.tsx";
import {Dictionary, Nomenclature, UUID} from "@logistics/data/types";
import {useGet} from "@logistics/hooks/hooks.ts";
import Api from "@features/api/api.ts";
import {RelationTable} from "@logistics/components/RelationTable.tsx";

type OrderSpecificationTabProps = {
    id: UUID
    api: string
}

export function OrderSpecificationTab({ id, api } : OrderSpecificationTabProps) {
    //const [[noms]] = useGet<Nomenclature>(`${Api.nomenclatures}`)
    return (
        <RelationTable api={`${api}/${id}/specification`} >
            <GridColumn field='nomenclatureCategory' title='Category' width='100' editable={false} />
            <GridColumn field='nomenclatureName' title='Name' width='auto' />
            <GridColumn field='nomenclatureDescription' title='Description' width='auto' editable={false}/>
            <GridColumn field='amount' title='Amount' width='100' />
            <GridColumn field='total' title='Total' width='100' />
        </RelationTable>
    );
}

