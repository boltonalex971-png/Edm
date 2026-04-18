import PropTypes from 'prop-types'
import React from 'react'

type PageTitleProps = {
    title: string
}

export function PageTitle({ title }: PageTitleProps) {
    return (
        <>
            <h3>{title}</h3>
        </>
    )
}
