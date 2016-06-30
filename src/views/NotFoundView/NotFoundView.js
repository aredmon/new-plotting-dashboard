import React from 'react';
import { Link } from 'react-router';

export class NotFoundView extends React.Component {
  render () {
    return (
      <div className='container text-center'>
        <h1>Aw Snap!</h1>
        <p>Something went wrong...where were you trying to go?</p>
        <hr />
        <Link to='/'>Back To Home View</Link>
      </div>
    );
  }
}

export default NotFoundView;
