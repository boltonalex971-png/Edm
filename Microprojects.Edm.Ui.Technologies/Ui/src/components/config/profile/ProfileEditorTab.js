import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { ApiContext } from '../../../ApiContext';
import { PluginContainer } from '@microprojects/react-utils';

ProfileEditorTab.propTypes = {
    id: PropTypes.string,
    profiler: PropTypes.string
    // api: PropTypes.string,
    // onDetailSelected: PropTypes.func
}

export function ProfileEditorTab({ id, profiler }) {
    const location = useContext(ApiContext);
    return (
        <div>
            <PluginContainer src={`${location}/profiles/${profiler}/profile/${id}`} width='100%' />
        </div>
    );
}

