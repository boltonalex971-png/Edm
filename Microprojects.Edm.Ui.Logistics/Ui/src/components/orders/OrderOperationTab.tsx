import React from 'react';
import PropTypes from 'prop-types';
import { GridColumn } from '@progress/kendo-react-grid';
import {DropDownCell} from "@logistics/components/DropDownCell.tsx";
import {Dictionary, Nomenclature, UUID} from "@logistics/data/types";
import {useGet} from "@logistics/hooks/hooks.ts";
import Api from "@features/api/api.ts";
import {RelationTable} from "@logistics/components/RelationTable.tsx";

type OrderOperationTabProps = {
    id: UUID
    api: string
}

export function OrderOperationTab({ id, api } : OrderOperationTabProps) {
    //const [[noms]] = useGet<Nomenclature>(`${Api.nomenclatures}`)
    return (
        <RelationTable api={`${api}/${id}/operations`} >
            <GridColumn field='processName' title='Process' width='auto' editable={false} />
            <GridColumn field='processNomenclatureName' title='Name' width='auto' />
            <GridColumn field='startTime' title='Started' width='150' />
            <GridColumn field='endTime' title='Completed' width='150' />
        </RelationTable>
    );
}

