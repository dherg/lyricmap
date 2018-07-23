import React, {Component} from 'react';
import PropTypes from 'prop-types';

export default class Pin extends Component {
  static propTypes = {
    pinID: PropTypes.string,
    lat: PropTypes.number,
    lng: PropTypes.number,
    text: PropTypes.string,
  };

  static defaultProps = {
    text : 'test',
  };

  onClick() {
    // open InfoWindow
    this.props.onPinClick(this.props.pinID, this.props.lat, this.props.lng);
  }

  render() {
    return (

        <div className="Pin-container">
            <div className="Pin-body" onClick={() => this.onClick()}>
                {this.props.lat}
                {this.props.lng}
            </div>
        </div>

    );
  }
}