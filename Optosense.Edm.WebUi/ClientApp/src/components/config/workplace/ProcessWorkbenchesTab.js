import React from 'react';
import Api from '../../api';
import PropTypes from 'prop-types';
import { GridColumn } from '@progress/kendo-react-grid';
import { RelationTable } from '../../RelationTable';
import { dropDownCell, linkTextCell } from '../../DropDownCell';
import { useGet } from '../../hooks/hooks';
import { ProcessDetail } from '../Processes';
import { useHistory } from 'react-router-dom';
import { WorkbenchDetail } from '../Workbenches';

ProcessWorkbenchesTab.propTypes = {
    id: PropTypes.number,
    api: PropTypes.string,
    onDetailSelected: PropTypes.func
}

export function ProcessWorkbenchesTab({ id, api, onDetailSelected }) {
    const wbClick = (wbId) => {
        onDetailSelected(
            <WorkbenchDetail
                workbenchId={wbId}
                api={`${api}/workbenches`}
                onClose={() => onDetailSelected()}
            />
        );
    };
    return (
        <RelationTable api={`${api}/${id}/workbenches`} removable >
            <GridColumn title='Name' field='name' editable={true}
                cell={linkTextCell({ fieldId: 'id', onClick: wbClick })}
            />
            <GridColumn title='Description' field='description' editable={true} />
        </RelationTable>
    );
}

