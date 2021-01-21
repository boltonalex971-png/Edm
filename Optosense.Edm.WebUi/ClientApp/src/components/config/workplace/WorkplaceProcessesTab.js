import React from 'react';
import Api from '../../api';
import PropTypes from 'prop-types';
import { GridColumn } from '@progress/kendo-react-grid';
import { RelationTable } from '../../RelationTable';
import { dropDownCell } from '../../DropDownCell';
import { useGet } from '../../hooks/hooks';
import { ProcessDetail } from '../Processes';
import { useHistory } from 'react-router-dom';

WorkplaceProcessesTab.propTypes = {
    id: PropTypes.number,
    api: PropTypes.string,
    onDetailSelected: PropTypes.func
}

export function WorkplaceProcessesTab({ id, api, onDetailSelected }) {
    const history = useHistory();
    const [[data]] = useGet(`${api}/processes`);
    const processClick = (processId) => {
        const path = '/config/processes';
        onDetailSelected(
            <ProcessDetail
                processId={processId}
                api={Api.processes}
                path={path}
                onClose={() => onDetailSelected()}
                onUp={() => history.push(`${path}/${processId}`)}
            />
        );
    };
    return (
        <RelationTable api={`${api}/${id}/processes`} removable >
            {data &&
                <GridColumn
                    width={200}
                    field='processId'
                    title='Process'
                    cell={dropDownCell({
                        getData: () => data,
                        key: 'id',
                        text: 'name',
                        fieldName: 'processName',
                        onClick: processClick
                    })}
                />
            }
            <GridColumn title='Description' field='processDescription' editable={false} />
        </RelationTable>
    );
}

