import React, {Component} from 'react';

import { putDisplayName } from './App';

import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';

// modal to prompt new user to set their display name
export default class NamePrompt extends Component {
  constructor(props) {
    super(props);
    this.handleSubmit = this.handleSubmit.bind(this);

    this.state = {
      validated: false
    };
  }

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
      <Modal show={this.props.show}>
        <Modal.Header>
          <Modal.Title>What should we call you?</Modal.Title>
        </Modal.Header>
        <Form noValidate validated={this.state.validated} onSubmit={e => this.handleSubmit(e)}>
          <Form.Group controlId="formNickname">
            <Form.Control name="nickname" required type="text" placeholder="Enter a nickname." maxLength="32"/>
            <Form.Control.Feedback type="invalid">
              Your nickname can't be blank!
            </Form.Control.Feedback>
            <Form.Text className="text-muted">
              Don't worry, you can change your nickname later.
            </Form.Text>
          </Form.Group>
          <Modal.Footer>
            <Button type="submit">Submit</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    )
  }

}