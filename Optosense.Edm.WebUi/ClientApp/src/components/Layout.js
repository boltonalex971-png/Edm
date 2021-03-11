import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Container } from 'reactstrap';
import { NavMenu } from './NavMenu';

export class Layout extends Component {

    render() {
        return (
            <div>
                <NavMenu />
                <div style={{ margin: '0 1rem 0 1rem' }}>
                    <div style={{ minHeight: 'calc(100vh - 150px)' }} >
                        {this.props.children}
                    </div>
                    <footer>
                        <hr />
                        <p>&#169; Microprojects 2020</p>
                    </footer>
                </div>
            </div>
        );
    }
}

Layout.propTypes = {
    children: PropTypes.any
};
