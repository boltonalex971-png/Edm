import React, { useContext } from 'react';
import { Link, useRouteMatch } from 'react-router-dom';
import { Alert } from 'reactstrap';
import { useGet } from '../hooks/hooks';
import { Grid, GridColumn } from '@progress/kendo-react-grid';
import api from '../api';
import { Button } from '@progress/kendo-react-buttons';

export const OperationPlugins = (props) => {
    const [[ops], loading, error] = useGet(`${api.plugins}/operations`, []);
    return (
        <>
            {loading && <h5>Loading operations...</h5>}
            {error && <Alert color='red'>{error}</Alert>}
            {ops &&
                <div style={{ margin: 10 }}>
                    <h5>Operation Plugins</h5>
                    <Grid data={ops} scrollable='none'>
                        <GridColumn field='guid' title='Global Unique Identifier' width={400} />
                        <GridColumn field='name' title='Operation Name' width={200}
                            cell={(cellProps) =>
                                <td>
                                    <button type='button' className='btn btn-link'
                                        onClick={
                                            (e) => {
                                                window.open(`/${cellProps.dataItem.homepage}`, '_blank');
                                                e.target.blur();
                                            }
                                        }
                                    >
                                        {cellProps.dataItem.name}
                                    </button>
                                </td>
                            }
                        />
                        <GridColumn field='description' title='Description' />
                    </Grid>
                </div>
            }
        </>
    );
};

