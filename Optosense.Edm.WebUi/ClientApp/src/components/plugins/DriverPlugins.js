import React, { useContext } from 'react';
import { useRouteMatch } from 'react-router-dom';
import { Alert } from 'reactstrap';
import { useGet } from '../hooks/hooks';
import { Grid, GridColumn } from '@progress/kendo-react-grid';
import api from '../api';

export const DriverPlugins = (props) => {
    const [[drivers], loading, error] = useGet(`${api.plugins}/drivers`, []);
    return (
        <>
            {loading && <h5>Loading drivers...</h5>}
            {error && <Alert color='red'>{error}</Alert>}
            {drivers &&
                <div style={{ margin: 10 }}>
                    <h5>Driver Plugins</h5>
                    <Grid data={drivers} scrollable='none'>
                        <GridColumn field='guid' title='Global Unique Identifier' width={400} />
                        <GridColumn field='name' title='Driver Name' width={200} />
                        <GridColumn field='profileName' title='Profiler Name' />
                        <GridColumn field='description' title='Description' />
                    </Grid>
                </div>
            }
        </>
    );
};

