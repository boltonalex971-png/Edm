import React from 'react';
import PropTypes from 'prop-types';
import { GridColumn } from '@progress/kendo-react-grid';
import { RelationTable } from '../../RelationTable';
import { DropDownCell } from '../../DropDownCell';
import { useGet } from '../../hooks/hooks';
import { HostDetail } from '../Hosts';
import Api from '../../api';
import { useHistory } from 'react-router-dom';

DeviceHostsTab.propTypes = {
    id: PropTypes.number,
    api: PropTypes.string,
    onDetailSelected: PropTypes.func
}

export function DeviceHostsTab({ id, api, onDetailSelected }) {
    const history = useHistory();
    const [[data]] = useGet(`${api}/hosts`);
    const hostClick = (hostId) => {
        const path = '/config/hosts';
        onDetailSelected(<HostDetail
            hostId={hostId}
            api={Api.hosts}
            path={path}
            onClose={() => onDetailSelected()}
            onUp={() => history.push(`${path}/${hostId}`)}
        />);
    };
    return (
        <RelationTable api={`${api}/${id}/hosts`} removable >
            {data &&
                <GridColumn
                    width={200}
                    field='hostId'
                    title='Host'
                    cell={(cellProps) =>
                        <DropDownCell {...cellProps}
                            getData={() => data}
                            id='id'
                            text='name'
                            fieldName='hostName'
                            fieldId='hostId'
                            onClick={hostClick}
                        />
                    }
                />
            }
            <GridColumn field={'hostUrl'} title={'Address'} editable={false} />
        </RelationTable>

    );
}

