import React from 'react';
import PropTypes from 'prop-types';
import { RelationTable } from '@microprojects/edm-components/components';
import { DropDownCell } from '@microprojects/edm-components/components';
import { useGet } from '@microprojects/edm-components/hooks';
import { useTranslation } from 'react-i18next';
import { HostDetail } from '../Hosts';
import Api from '../../api';
import { useNavigate } from 'react-router-dom';

DeviceHostsTab.propTypes = {
    id: PropTypes.string,
    api: PropTypes.string,
    onDetailSelected: PropTypes.func
}

export function DeviceHostsTab({ id, api, onDetailSelected, parents }) {
    const navigate = useNavigate();
    const [[data]] = useGet(`${api}/hosts`);
    const { t } = useTranslation('tech');

    const columns = [
        {
            field: 'hostId',
            headerName: t('common.host'),
            width: 200,
            renderCell: (params) => (
                <DropDownCell
                    {...params}
                    getData={() => data || []}
                    dataKey='id'
                    text='name'
                    fieldName='hostName'
                    fieldId='hostId'
                    onClick={(hostId, itemUpdate) => {
                        const path = '/config/hosts';
                        onDetailSelected(
                            <HostDetail
                                type='host'
                                hostId={hostId}
                                api={Api.hosts}
                                path={path}
                                onClose={() => onDetailSelected()}
                                onUp={() => navigate(`${path}/${hostId}`)}
                                onUpdate={itemUpdate}
                                parents={parents}
                            />
                        );
                    }}
                />
            )
        },
        { field: 'hostUrl', headerName: t('common.address'), flex: 1, editable: false }
    ];

    return (
        <RelationTable 
            api={`${api}/${id}/hosts`} 
            removable 
            columns={columns}
        />
    );
}


