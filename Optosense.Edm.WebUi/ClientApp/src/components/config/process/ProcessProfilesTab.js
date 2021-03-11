import React from 'react';
import Api from '../../api';
import PropTypes from 'prop-types';
import { GridColumn } from '@progress/kendo-react-grid';
import { RelationTable } from '../../RelationTable';
import { dropDownCell, linkTextCell } from '../../DropDownCell';
import { useGet } from '../../hooks/hooks';
import { ProfileDetail } from '../Profiles';

ProcessProfilesTab.propTypes = {
    id: PropTypes.number,
    api: PropTypes.string,
    onDetailSelected: PropTypes.func
}

export function ProcessProfilesTab({ id, api, onDetailSelected }) {
    const [[data]] = useGet(`${Api.devices}/profilers`);
    return (
        <RelationTable api={`${api}/${id}/profiles`} removable >
            {data &&
                <GridColumn
                    width={200}
                    field='profilerGuid'
                    title='Profiler'
                    cell={dropDownCell({
                        getData: () => data,
                        key: 'guid',
                        text: 'name',
                        fieldId: 'guid'
                    })}
                />
            }
            <GridColumn field='name' title='Name'
                cell={linkTextCell({
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
            <GridColumn field='description' title='Description' />
        </RelationTable>
    );
}

