import React, { Component } from 'react';

export default class Random extends Component {
  constructor(props) {
    super(props);

    this.handleClick = this.handleClick.bind(this);
  }

  handleClick() {
    this.props.handleRandomClick();
  }

  render() {
    return (
      <div onClick={this.handleClick}>
                Random Pin
      </div>
    );
  }
}
