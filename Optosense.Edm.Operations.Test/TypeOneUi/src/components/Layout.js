import React, { Component } from 'react';

export class Layout extends Component {
  render() {
    return (
      <div>
        {this.props.header}
        <div>
          <div style={{ minHeight: 'calc(100vh - 150px)' }} >
            {this.props.content}
          </div>
          <footer>
            <hr />
            <p style={{ marginLeft: '1rem' }}>&#169; Microprojects 2020</p>
          </footer>
        </div>
      </div>
    );
  }
}
