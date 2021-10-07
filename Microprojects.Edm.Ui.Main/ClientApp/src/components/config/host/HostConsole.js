import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { LoadingContainer } from '../../utils/Utils';
import { Detail } from '../../MasterDetail';

HostConsole.propTypes = {
    id: PropTypes.number,
    data: PropTypes.object,
    onClose: PropTypes.func
}

export function HostConsole({ onClose, data }) {
    const [loading, setLoading] = useState(true);
    return (
        <Detail
            data={data}
            icon={<span className='bi bi-terminal' title='Console' />}
            card={
                <LoadingContainer loading={loading}>
                    <iframe title='Host Console'
                        src={`${data.url}:16331/console`}
                        height='500'
                        width='100%'
                        seamless
                        frameBorder='0'
                        onLoad={() => setLoading(false)}
                    />
                </LoadingContainer>
            }
            onClose={onClose}
        />

    );
}

