import React, { Component } from 'react';
import { PageTitle } from '../PageTitle';

export class Home extends Component {

  render() {
    return (
      <>
        <div>
          <PageTitle title='Welcome to Americana' />
        </div>
        <hr />
        <p>Please make your selection followed by the pound sign now <sup><a href='https://youtu.be/yQs86zeAyS0'>*</a></sup></p>
      </>
    );
  }
}

