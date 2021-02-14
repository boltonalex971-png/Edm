import React from 'react';
import Api from '../../api';
import PropTypes from 'prop-types';
import { GridColumn } from '@progress/kendo-react-grid';
import { RelationTable } from '../../RelationTable';
import { dropDownCell } from '../../DropDownCell';
import { useGet } from '../../hooks/hooks';
import { ProfileDetail } from '../Profiles';

ProcessProfilesTab.propTypes = {
    id: PropTypes.number,
    api: PropTypes.string,
    onDetailSelected: PropTypes.func
}

export function ProcessProfilesTab({ id, api, onDetailSelected }) {
    const [[data]] = useGet(`${Api.devices}/types`);
    return (
        <RelationTable api={`${api}/${id}/profiles`} removable >
            {data &&
                <GridColumn
                    width={200}
                    field='type'
                    title='Device Type'
                    cell={dropDownCell({
                        getData: () => data,
                        key: 'id',
                        text: 'name',
                        fieldName: 'type',
                        fieldId: 'id',
                        onClick: (profileId) => onDetailSelected(
                            <ProfileDetail
                                profileId={profileId}
                                api={Api.profiles}
                                onClose={() => onDetailSelected()}
                            />
                        )
                    })}
                />
            }
            <GridColumn field='name' title='Name' />
            <GridColumn field='description' title='Description' />
        </RelationTable>
    );
}

