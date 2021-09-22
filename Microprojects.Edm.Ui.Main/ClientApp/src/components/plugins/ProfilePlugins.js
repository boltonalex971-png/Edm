import React, { useContext } from 'react';
import { useRouteMatch } from 'react-router-dom';
import { Alert } from 'reactstrap';
import { useGet } from '../hooks/hooks';
import { Grid, GridColumn } from '@progress/kendo-react-grid';
import api from '../api';

export const ProfilePlugins = (props) => {
    const [[profiles], loading, error] = useGet(`${api.plugins}/profiles`, []);
    return (
        <>
            {loading && <h5>Loading profiles...</h5>}
            {error && <Alert color='red'>{error}</Alert>}
            {profiles &&
                <div style={{ margin: 10 }}>
                    <h5>Profile Plugins</h5>
                    <Grid data={profiles} scrollable='none'>
                        <GridColumn field='guid' title='Global Unique Identifier' width={400} />
                        <GridColumn field='name' title='Profile Type Name' width={200} />
                        <GridColumn field='description' title='Description' />
                    </Grid>
                </div>
            }
        </>
    );
};

