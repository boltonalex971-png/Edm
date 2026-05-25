import React from 'react';
import Api from '../../api';
import PropTypes from 'prop-types';
import { RelationTable } from '@microprojects/edm-components/components';
import { LinkTextCell } from '@microprojects/edm-components/components';
import { useGet } from '@microprojects/edm-components/hooks';
import { useTranslation } from 'react-i18next';
import { AuditDetail } from '../Audits';

ProfileAuditsTab.propTypes = {
    id: PropTypes.string,
    api: PropTypes.string,
    onDetailSelected: PropTypes.func
}

export function ProfileAuditsTab({ id, api, onDetailSelected, parents }) {
    const [[params]] = useGet(`${api}/${id}/params`, [id]);
    const { t } = useTranslation('tech');

    const columns = [
        {
            field: 'name',
            headerName: t('common.name'),
            width: 200,
            renderCell: (paramsData) => (
                <LinkTextCell
                    {...paramsData}
                    onClick={(auditId, itemUpdate) => {
                        onDetailSelected(
                            <AuditDetail
                                params={params}
                                auditId={auditId}
                                api={Api.audits}
                                onClose={() => onDetailSelected()}
                                onUpdate={itemUpdate}
                                parents={parents}
                            />
                        );
                    }}
                />
            )
        },
        { field: 'description', headerName: t('common.description'), flex: 1 }
    ];

    return (
        <RelationTable 
            api={`${api}/${id}/audits`} 
            removable 
            columns={columns}
        />
    );
}


