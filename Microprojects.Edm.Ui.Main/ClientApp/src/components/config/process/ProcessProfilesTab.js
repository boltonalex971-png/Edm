import React from 'react';
import Api from '../../api';
import PropTypes from 'prop-types';
import { GridColumn } from '@progress/kendo-react-grid';
import { RelationTable, SubDetailColumn } from '../../RelationTable';
import { DropDownCell, LinkTextCell } from '../../DropDownCell';
import { useGet } from '../../hooks/hooks';
import { ProfileDetail } from '../Profiles';
import { Chip, ChipList } from '@progress/kendo-react-buttons';

ProcessProfilesTab.propTypes = {
    id: PropTypes.number,
    api: PropTypes.string,
    missedInputs: PropTypes.arrayOf(PropTypes.string),
    onDetailSelected: PropTypes.func
}

export function ProcessProfilesTab({ id, api, missedInputs, onDetailSelected }) {
    const [[data]] = useGet(`${Api.devices}/profilers`);
    return (
        <RelationTable api={`${api}/${id}/profiles`} removable >
            <GridColumn
                width={200}
                field='profilerGuid'
                title='Profiler'
                cell={(cellProps) => data &&
                    <DropDownCell {...cellProps}
                        getData={() => data} id='guid' text='name' fieldId='guid'
                    />
                }
            />
            <SubDetailColumn field='name' title='Name'
                cell={(cellProps) =>
                    <LinkTextCell {...cellProps}
                        fieldId='id'
                        onClick={(profileId) => onDetailSelected(
                            <ProfileDetail
                                profileId={profileId}
                                api={Api.profiles}
                                onClose={() => onDetailSelected()}
                                onUpdate={cellProps.itemUpdate}
                            />
                        )}
                    />
                }
            />
            <GridColumn field='description' title='Description' />
            <GridColumn field='input' title='Input params' cell={(cellProps) =>
                <td>
                    <ChipList {...cellProps}
                        data={JSON.parse(cellProps.dataItem[cellProps.field] || '[]').map((el => ({ text: el, value: el })))}
                        chip={(chipProps) => {
                            const missed = (missedInputs || []).find(el => el === chipProps.text);
                            return <Chip {...chipProps}
                                themeColor={missed ? 'error' : 'base'}
                                icon={missed ? 'k-i-warning ' : 'k-i-check-outline'}
                            />
                        }}
                    />
                </td>}
            />
            <GridColumn field='output' title='Ouput params' cell={(cellProps) =>
                <td>
                    <ChipList {...cellProps} data={JSON.parse(cellProps.dataItem[cellProps.field] || '[]').map((el => ({ text: el, value: el })))} />
                </td>}
            />
        </RelationTable>
    );
}

