import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { TabStrip, TabStripTab } from '@progress/kendo-react-layout';
import { ProcessProfilesTab } from './ProcessProfilesTab';
import { ProcessQualifiersTab } from './ProcessQualifiersTab';

ProcessTabs.propTypes = {
    api: PropTypes.string,
    id: PropTypes.number,
    missedInputs: PropTypes.arrayOf(PropTypes.string),
    onDetailSelected: PropTypes.func
}

export function ProcessTabs(props) {
    const [selected, setSelected] = useState(0);
    return (
        <TabStrip selected={selected} onSelect={(e) => setSelected(e.selected)}>
            <TabStripTab title={'Profiles'} >
                <ProcessProfilesTab {...props} />
            </TabStripTab>
            <TabStripTab title={'Qualifiers'} >
                <ProcessQualifiersTab {...props} />
            </TabStripTab>
        </TabStrip>
    );
}