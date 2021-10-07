import React from 'react';
import PropTypes from 'prop-types';
import { GridColumn } from '@progress/kendo-react-grid';
import { useGet } from '../hooks/hooks';
import { TabGrid } from './TabGrid';

export function LogTab({ href }) {
    const [[data]] = useGet(`${href}/api/log`);
    return (
        <>
            <TabGrid data={data}>
                <GridColumn field='timeGenerated' title='Time' />
                <GridColumn field='entryType' title="Type" />
                <GridColumn field='message' title='Message'
                    cell={(cellProps) =>
                        <td>
                            <div dangerouslySetInnerHTML={{ __html: cellProps.dataItem.message.replace('\r\n', '<br />') }}></div>
                        </td>
                    }
                />
                <GridColumn field='source' title='Source' />
            </TabGrid>
        </>
    );
}

LogTab.propTypes = {
    href: PropTypes.string
}

