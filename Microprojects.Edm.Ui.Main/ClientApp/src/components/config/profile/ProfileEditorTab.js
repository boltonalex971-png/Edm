import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { LoadingContainer } from '../../utils/Utils';
import { ApiContext } from '../../../ApiContext';

ProfileEditorTab.propTypes = {
    id: PropTypes.number,
    profiler: PropTypes.string
    // api: PropTypes.string,
    // onDetailSelected: PropTypes.func
}

export function ProfileEditorTab({ id, profiler }) {
    const [loading, setLoading] = useState(true);
    const location = useContext(ApiContext);
    return (
        <div>
            <LoadingContainer loading={loading}>
                <iframe src={`${location}/profiles/${profiler}/profile/${id}`} height='500' width='100%' seamless frameBorder='0' onLoad={() => setLoading(false)} />
            </LoadingContainer>
        </div>
    );
}

