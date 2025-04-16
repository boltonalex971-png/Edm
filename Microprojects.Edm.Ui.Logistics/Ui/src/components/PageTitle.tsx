import React from "react";
import PropTypes from 'prop-types';

type PageTitleProps = {
    title: string
}

export function PageTitle({ title } : PageTitleProps) {
    return (
        <>
            <h3>
                {title}
            </h3>
        </>
    );
}