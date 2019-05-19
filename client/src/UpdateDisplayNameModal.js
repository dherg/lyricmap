import React, {Component} from 'react';

import { putDisplayName } from './App';

import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Modal from 'react-bootstrap/Modal'

export default class UpdateDisplayNameModal extends Component {

  constructor(props) {
    super(props);
    this.handleSubmit = this.handleSubmit.bind(this);

    this.state = {
      validated: false
    };
  }

  // handle clicking the "submit" button
  handleSubmit(event) {
    event.preventDefault();
    event.stopPropagation();

    const form = event.currentTarget;

    if (form.checkValidity() === false) {
      return;
    }
    this.setState({ validated: true });

    // Put new display name
    putDisplayName(form.elements.nickname.value)

    this.props.closeNamePrompt();
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
              Enter a New Name
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form noValidate validated={this.state.validated} onSubmit={e => this.handleSubmit(e)}>
              <Form.Group controlId="formBasicEmail">
                <Form.Control name="nickname" required type="text" placeholder="Enter a new name." maxLength="32"/>
                <Form.Control.Feedback type="invalid">
                  Your nickname can't be blank!
                </Form.Control.Feedback>
                <Form.Text className="text-muted">
                  Don't worry, you can change it when you want.
                </Form.Text>
              </Form.Group>
              <Button variant="primary" type="submit">
                Submit
              </Button>
            </Form>
          </Modal.Body>

        </Modal>
    );
  }
}