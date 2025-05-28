import React from 'react';
import PropTypes from 'prop-types';
import { GridColumn } from '@progress/kendo-react-grid';
import {DropDownCell} from "@logistics/components/DropDownCell.tsx";
import {Dictionary, Nomenclature, UUID} from "@logistics/data/types";
import {useGet} from "@logistics/hooks/hooks.ts";
import Api from "@features/api/api.ts";
import {DateTimeCell, RelationTable} from "@logistics/components/RelationTable.tsx";

type OrderOperationTabProps = {
    id: UUID
    api: string
}

export function OrderOperationTab({ id, api } : OrderOperationTabProps) {
    //const [[noms]] = useGet<Nomenclature>(`${Api.nomenclatures}`)
    return (
        <RelationTable api={`${api}/${id}/operations`} >
            <GridColumn field='processName' title='Process' editable={false} />
            <GridColumn field='processNomenclatureName' title='Name' />
            <GridColumn field='startTime' title='Started' cell={DateTimeCell}/>
            <GridColumn field='endTime' title='Completed' cell={DateTimeCell}/>
        </RelationTable>
    );
}

