import React, {Component} from 'react';
import PropTypes from 'prop-types';

import { Link } from 'react-router-dom';

export default class Pin extends Component {
  static propTypes = {
    pinID: PropTypes.string,
    lat: PropTypes.number,
    lng: PropTypes.number,
  };

  constructor(props) {
    super(props);
    this.onClick = this.onClick.bind(this);
  }

  onClick() {
    // open InfoWindow
    this.props.onPinClick(this.props.pinID, this.props.lat, this.props.lng);
  }

  render() {
    return (
      <Link to={`/pins/${this.props.pinID}`}>
        <div className="Pin-container">
            <div className="Pin-body" onClick={this.onClick}>
            </div>
        </div>
      </Link>

    );
  }
}