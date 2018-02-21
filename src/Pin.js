import React, {Component} from 'react';
import PropTypes from 'prop-types';
// import shouldPureComponentUpdate from 'react-pure-render/function';

import {pinStyle} from './PinStyle';

export default class Pin extends Component {
  static propTypes = {
    text: PropTypes.string
  };

  static defaultProps = {};

  // shouldComponentUpdate = shouldPureComponentUpdate;

  render() {
    return (
       <div style={pinStyle}>
          {this.props.text}
       </div>
    );
  }
}