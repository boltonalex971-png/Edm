import React, { Component } from 'react';
import { Container } from 'reactstrap';

export class Layout extends Component {
  render() {
    return (
      <div className='mx-2'>
        {this.props.header}
        <div style={{ minHeight: 'calc(100vh - 150px)' }} >
          {this.props.content}
        </div>
        <footer>
          <hr />
          <p>&#169; Microprojects 2022</p>
        </footer>
      </div>
    );
  }
}
