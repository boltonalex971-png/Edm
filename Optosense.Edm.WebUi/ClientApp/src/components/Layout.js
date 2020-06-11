import React, { Component } from 'react';
import { Container } from 'reactstrap';
import { NavMenu } from './NavMenu';

export class Layout extends Component {

  render() {
    return (
      <div>
        <NavMenu />
        <Container>
          <div style={{ minHeight: 'calc(100vh - 150px)' }} >
            {this.props.children}
          </div>
          <footer>
            <hr />
            <p>&#169; Microprojects 2020</p>
          </footer>
        </Container>
      </div>
    );
  }
}
