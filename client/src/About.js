import React, {Component} from 'react';

import Header from './Header';

export default class About extends Component {
  render() {
    return (
      <div>
        <Header />
        <div>
          About text here
        </div>
      </div>
    );
  }
}