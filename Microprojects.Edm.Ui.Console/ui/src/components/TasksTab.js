import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Grid, GridColumn } from '@progress/kendo-react-grid';
import { useGet } from '../hooks/hooks';
import { TabGrid } from './TabGrid';

export function TasksTab({ href }) {
    const [[avail]] = useGet(`${href}/api/tasks/available`);
    const [[running]] = useGet(`${href}/api/tasks/running`);
    const [data] = useState([{ name: 'Running Jobs' }, { name: 'Available Jobs' }]);
    return (
        <Grid data={data} headerCellRender={(headerProps) => <></>}
            detail={(detailProps) =>
                <TabGrid data={detailProps.dataIndex === 0 ? running : avail} >
                    <GridColumn field='name' title='Job' />
                    <GridColumn field='description' title='Description' />
                    <GridColumn field='status' title='Status' />
                    <GridColumn field='type' title='Lifetime' />
                </TabGrid>
            }
        >
            <GridColumn cell={(cellProps) => <span className='text-uppercase' ><strong>{cellProps.dataItem.name}</strong></span>} />
        </Grid>
    );
}

TasksTab.propTypes = {
    href: PropTypes.string
}
