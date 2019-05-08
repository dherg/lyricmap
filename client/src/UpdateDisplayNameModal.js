import React, {Component} from 'react';

import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Modal from 'react-bootstrap/Modal'


export default class UpdateDisplayNameBox extends Component {

  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);

    this.state = {
      'text': "",    
    };
  }

  // handle clicking the "submit" button
  handleSubmit(event) {
    event.preventDefault();
    console.log('this.state.text = ', this.state.text)
    this.props.updateDisplayName(this.state.text);
  }

  // handle change in text box
  handleChange(event) {
    this.setState({text: event.target.value});
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
            <Form onSubmit={this.handleSubmit}>
              <Form.Group controlId="formBasicEmail">
                <Form.Control placeholder="New name" onChange={this.handleChange}/>
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