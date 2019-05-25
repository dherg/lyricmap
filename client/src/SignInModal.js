import React, {Component} from 'react';

import GoogleSignIn from './GoogleSignIn';

import Modal from 'react-bootstrap/Modal'

export default class SignInModal extends Component {

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
            <GoogleSignIn handleUpdateCurrentUser={this.props.updateCurrentUser} 
                          handlePromptForName={this.props.handlePromptForName}
                          handleSignInFinished={this.props.handleHideModal}/>
          </Modal.Body>

        </Modal>
    );
  }
}