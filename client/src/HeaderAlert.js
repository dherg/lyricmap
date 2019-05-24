import React, {Component} from 'react';

import Alert from 'react-bootstrap/Alert'

// Customizable alert to appear below header
export default class HeaderAlert extends Component {

  constructor(props) {
    super(props);

  }

  render() {
    console.log(this.props.show)
    return (
      <Alert id="Header-Alert" 
             dismissible
             onClose={this.props.onClose} 
             show={this.props.show}
             variant={this.props.variant}>
          {this.props.message}
      </Alert>
    ); // close return
  } // close render()
}