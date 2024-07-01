import React from 'react';
import Api from '../../api';
import PropTypes from 'prop-types';
import { GridColumn } from '@progress/kendo-react-grid';
import { RelationTable } from '../../RelationTable';
import { LinkTextCell } from '../../DropDownCell';
import { useGet } from '../../hooks/hooks';
import { AuditDetail } from '../Audits';
import { useHistory } from 'react-router-dom';
import { Input } from '@progress/kendo-react-inputs';

ProfileAuditsTab.propTypes = {
    id: PropTypes.number,
    api: PropTypes.string,
    onDetailSelected: PropTypes.func
}

export function ProfileAuditsTab({ id, api, onDetailSelected }) {
    const [[params]] = useGet(`${api}/${id}/params`, [id]);
    return (
        <RelationTable api={`${api}/${id}/audits`} removable >
            <GridColumn title='Name' field={'name'}
                cell={(cellProps) =>
                    <LinkTextCell {...cellProps}
                        onClick={(auditId, itemUpdate) => {
                            onDetailSelected(
                                <AuditDetail
                                    params={params}
                                    auditId={auditId}
                                    api={Api.audits}
                                    onClose={() => onDetailSelected()}
                                    onUpdate={itemUpdate}
                                />
                            );
                        }}
                    />
                }
            />
            <GridColumn title='Description' field='description' />
        </RelationTable>
    );
}

