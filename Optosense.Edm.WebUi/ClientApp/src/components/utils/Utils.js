import React from 'react';
import PropTypes from 'prop-types';

export function Loading() {
    return (
        <div style={{ width: '100%', textAlign: 'center' }}>
            Loading...
        </div>
    );
}

DetailStub.propTypes = {
    message: PropTypes.string.isRequired
}

export function DetailStub({ message }) {
    return (
        <div style={{ width: '100%', textAlign: 'center' }}>
            {message}
        </div>
    );
}