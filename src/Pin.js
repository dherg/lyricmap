import React, {Component} from 'react';
import PropTypes from 'prop-types';
// import shouldPureComponentUpdate from 'react-pure-render/function';

import {pinStyle} from './PinStyle';

export default class Pin extends Component {
  static propTypes = {
    text: PropTypes.string
  };

  static defaultProps = {
    text : 'test',
  };

  // shouldComponentUpdate = shouldPureComponentUpdate;

  clickAction() {
    alert('alert>@>>');
  }

  render() {
    return (

        <div className="Pin-container">
            <div className="Pin-body" onClick={() => this.props.onPinClick('PIN ID')}>
                {this.props.text}
            </div>
        </div>

    );
  }
}