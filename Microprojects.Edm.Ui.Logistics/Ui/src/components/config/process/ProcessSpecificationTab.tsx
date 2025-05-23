import React from 'react';
import PropTypes from 'prop-types';
import { GridColumn } from '@progress/kendo-react-grid';
import {RelationTable} from "../../RelationTable";
import {DropDownCell} from "@logistics/components/DropDownCell.tsx";
import {Dictionary, Nomenclature} from "@logistics/data/types";
import {useGet} from "@logistics/hooks/hooks.ts";
import Api from "@features/api/api.ts";

type ProcessSpecificationTabProps = {
    id: number
    api: string
}

export function ProcessSpecificationTab({ id, api } : ProcessSpecificationTabProps) {
    const [[noms]] = useGet<Nomenclature>(`${Api.nomenclatures}`)
    return (
        <RelationTable api={`${api}/${id}/specification`} removable editable creatable>
            <GridColumn field='nomenclatureCategory' title='Category' width='auto' editable={false} />
            <GridColumn field='nomenclatureId' title='Name' width={200} 
                        cell={p => 
                            <DropDownCell {...p} getData={_ => noms} id='id' text='name'/>
                        }
            />
            <GridColumn field='nomenclatureDescription' title='Description' width='auto' editable={false}/>
            <GridColumn field='quantity' title='Quantity' width='auto' />
        </RelationTable>
    );
}

