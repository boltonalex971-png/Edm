import React from 'react';
import Api from '../../api';
import PropTypes from 'prop-types';
import { GridColumn } from '@progress/kendo-react-grid';
import { RelationTable } from '../../RelationTable';
import { DropDownCell, LinkTextCell } from '../../DropDownCell';
import { useGet } from '../../hooks/hooks';
import { ProcessDetail } from '../Processes';
import { useHistory } from 'react-router-dom';
import { ProcessWorkbenchesDetail } from './ProcessWorkbenches';

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
    const workbenchesClick = (wsPrId) => {
        onDetailSelected(
            <ProcessWorkbenchesDetail
                workplaceProcessId={wsPrId}
                api={`${api}/processes`}
                onClose={() => onDetailSelected()}
            />
        );
    };
    return (
        <RelationTable api={`${api}/${id}/processes`} removable >
            <GridColumn
                width={200}
                field='processId'
                title='Process'
                cell={(cellProps) => data &&
                    <DropDownCell {...cellProps}
                        getData={() => data}
                        id='id'
                        text='name'
                        fieldName='processName'
                        onClick={(processId, itemUpdate) => {
                            const path = '/config/processes'
                            onDetailSelected(
                                <ProcessDetail
                                    processId={processId}
                                    api={Api.processes}
                                    path={path}
                                    onClose={() => onDetailSelected()}
                                    onUp={() => history.push(`${path}/${processId}`)}
                                    onUpdate={itemUpdate}
                                />
                            )
                        }}
                    />
                }
            />
            <GridColumn
                width={100}
                field='workplaceProcessId'
                title='Workbenches' //{<span className='k-icon k-i-cogs' title='Workbench lists' ></span>}
                cell={(cellProps) =>
                    <LinkTextCell {...cellProps}
                        editable={false}
                        onClick={workbenchesClick}
                        template={<span title='Configure workbenches for the process' >Configure&hellip;</span>}
                    />
                }
            />
            <GridColumn title='Description' field='processDescription' editable={false} />
        </RelationTable>
    );
}

