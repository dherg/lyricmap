import React, { Component } from 'react';

import { Link } from 'react-router-dom';

export default class Pin extends Component {
  constructor(props) {
    super(props);
    this.onClick = this.onClick.bind(this);
  }

  onClick() {
    this.props.onPinClick(this.props.pinID, this.props.lat, this.props.lng);
  }

  render() {
    return (
      <Link to={`/pins/${this.props.pinID}`}>
        <div className="Pin-container">
          <div className="Pin-body" onClick={this.onClick} />
        </div>
      </Link>
    );
  }
}
