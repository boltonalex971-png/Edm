import React from 'react';
import {GridColumn} from '@progress/kendo-react-grid';
import {RelationTable} from '../../RelationTable';
import {DropDownCell, LinkTextCell} from '../../DropDownCell';
import {useGet} from "../../../hooks/hooks";
import Api from '../../../features/api/api'
import React from 'react';
import {GridColumn} from '@progress/kendo-react-grid';
import {RelationTable} from '../../RelationTable';
import {DropDownCell, LinkTextCell} from '../../DropDownCell';
import {useGet} from "../../../hooks/hooks";
import Api from '../../../features/api/api'
import {ProcessDetail} from "@logistics/components/config/process/Processes.tsx";
import {ProcessKind, UUID} from "@logistics/data/types";

export type ProcessProfilesTabProps = {
    id: UUID,
    api: string,
    kind?: ProcessKind,
    missedInputs: Array<string>,
    onDetailSelected: Function
}

export function ProcessSubProcessesTab({id, api, kind, missedInputs, onDetailSelected}: ProcessProfilesTabProps) {
    const allowedChildKind = kind === 'Production' ? 'Technology' : kind === 'Technology' ? 'Operation' : undefined;
    const [[data]] = useGet(allowedChildKind ? `${api}?kind=${allowedChildKind}` : `${api}`);
    return (
        <RelationTable api={`${api}/${id}/subprocesses`} removable={true} editable={true} creatable={!!allowedChildKind}>
            <GridColumn 
                width='100' 
                title={'Order'} 
                field={'order'} 
                editable 
            />
            <GridColumn
                editable={false}
                width='200'
                field='linkedProcessId'
                title='Process'
                cell={(cellProps) => data &&
                    <DropDownCell
                        {...cellProps}
                        getData={() => data}
                        id='id' text='name'
                        fieldId={cellProps.field || 'id'}
                        onClick={(id, itemUpdate) => onDetailSelected(
                            <ProcessDetail
                                processId={id}
                                api={Api.processes}
                                onClose={() => onDetailSelected()}
                                onUpdate={itemUpdate}
                            />
                        )}
                    />
                }
            />
            <GridColumn field='linkedProcessKind' title='Kind' editable={false}/>
            <GridColumn field='linkedProcessDescription' title='Description' editable={false}/>
        </RelationTable>
    );
}

