import React from 'react';

export const Layout = (props) => {
  return (
    <div className='mx-2'>
      {props.header}
      <div style={{ minHeight: 'calc(100vh - 125px)', display: 'flex' }} >
        {props.children}
      </div>
      <footer>
        <hr />
        <p>&#169; Microprojects {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
