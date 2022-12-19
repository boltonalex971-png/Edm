import React from 'react';
import { Grid } from '@progress/kendo-react-grid';

export const TabGrid = (props) => {
    return (
        <>
            <style>
                {`
                    /* TODO Fix for Kendo Grid width in container */
                    .k-animation-container-relative {
                        width: 100%;
                    }
                    .k-grid td {
                        padding: 0.5rem 0.5rem;
                    }
                    .k-grid td button {
                        padding: 0;
                    }
                `}
            </style>

            <Grid scrollable='none' {...props}
                headerCellRender={(_, headerProps) => <td style={{ fontWeight: 'bolder' }}>{headerProps.title}</td>}>
            </Grid>
        </>
    );
}

