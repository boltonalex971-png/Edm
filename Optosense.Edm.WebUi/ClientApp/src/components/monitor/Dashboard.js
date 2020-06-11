import React from 'react';
import { PageTitle } from '../PageTitle';
import Example from './Example';

export function Dashboard() {
  return (
    <>
      <div>
        <PageTitle title='Dashboard' />
      </div>
      <hr />
      <Example />
    </>
  );
}

