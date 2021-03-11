import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { TabStrip, TabStripTab } from '@progress/kendo-react-layout';
import { AuditEditorTab } from './AuditEditorTab';

AuditTabs.propTypes = {
    api: PropTypes.string,
    id: PropTypes.number,
    params: PropTypes.array,
    onDetailSelected: PropTypes.func
}

export function AuditTabs(props) {
    const [selected, setSelected] = useState(0);
    return (
        <TabStrip selected={selected} onSelect={(e) => setSelected(e.selected)}>
            <TabStripTab title={'Zones'} >
                <AuditEditorTab {...props} />
            </TabStripTab>
        </TabStrip>
    );
}