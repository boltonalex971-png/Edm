import React from 'react';
import PropTypes from 'prop-types';
import { GridColumn } from '@progress/kendo-react-grid';
import { useGet } from '../hooks/hooks';
import { TabGrid } from './TabGrid';

export const DriversTab = ({ href }) => {
    const [[data]] = useGet(`${href}/api/drivers`, []);
    return (
        <TabGrid data={data}>
            <GridColumn field='name' title='Driver' />
            <GridColumn field='description' title='Description' />
            <GridColumn field='profileName' title='Profile' />
            <GridColumn field='guid' title='Guid' />
        </TabGrid>
    );
}

DriversTab.propTypes = {
    href: PropTypes.string
}
