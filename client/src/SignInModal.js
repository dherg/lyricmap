import React, {Component} from 'react';

import GoogleSignIn from './GoogleSignIn';

import Button from 'react-bootstrap/Button'
import Modal from 'react-bootstrap/Modal'

export default class SignInModal extends Component {

  constructor(props) {
    super(props);
  }

  render() {
    return(
      <Modal
          show={this.props.show}
          onHide={this.props.handleHideModal}
          dialogClassName="modal-90w"
          aria-labelledby="example-custom-modal-styling-title"
        >
          <Modal.Header closeButton>
            <Modal.Title id="example-custom-modal-styling-title">
              Sign In With Google
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <GoogleSignIn handleUpdateCurrentUser={this.props.updateCurrentUser} handlePromptForName={this.props.handlePromptForName}/>
            <Button onClick={this.props.handleSignOutButtonClick}> Sign Out </Button>
          </Modal.Body>

        </Modal>
    );
  }
}