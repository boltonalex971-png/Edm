import React from "react";
import PropTypes from 'prop-types';

PageTitle.propTypes = {
    title: PropTypes.string.isRequired
}

export function PageTitle({ title }) {
    return (
        <>
            <h3>
                {title}
            </h3>
        </>
    );
}