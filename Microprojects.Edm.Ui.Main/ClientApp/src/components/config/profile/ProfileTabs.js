import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { TabStrip, TabStripTab } from '@progress/kendo-react-layout';
import { ProfileEditorTab } from './ProfileEditorTab';
import { ProfileAuditsTab } from './ProfileAuditsTab';

ProfileTabs.propTypes = {
    api: PropTypes.string,
    profiler: PropTypes.string,
    id: PropTypes.number,
    onDetailSelected: PropTypes.func
}

export function ProfileTabs(props) {
    const [selected, setSelected] = useState(0);
    return (
        <TabStrip selected={selected} onSelect={(e) => setSelected(e.selected)}>
            <TabStripTab title={'Profile'} >
                <ProfileEditorTab {...props} />
            </TabStripTab>
            <TabStripTab title={'Audits'}>
                <ProfileAuditsTab {...props} />
            </TabStripTab>
        </TabStrip>
    );
}