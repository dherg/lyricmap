import React, { Component } from 'react';

import Form from 'react-bootstrap/Form';
import { postPin } from './App';
import LoadingButton from './LoadingButton';


// Component to add pin when song is not found in spotify search
export default class ManualAddPin extends Component {
  constructor(props) {
    super(props);
    this.handleSubmit = this.handleSubmit.bind(this);

    this.state = {
      isLoadingSubmissionResponse: false,
      validated: false,
    };
  }

  handleSubmit(event) {
    console.log(this.props);

    const form = event.currentTarget;
    event.preventDefault();
    event.stopPropagation();
    this.setState({ validated: true });
    if (form.checkValidity() === true) {
      console.log(this.props.lat, this.props.lng, form.elements.title.value, form.elements.artist.value, form.elements.lyric.value);
      this.setState({ isLoadingSubmissionResponse: true });
      postPin(this.props.lat, this.props.lng, form.elements.title.value, form.elements.artist.value, form.elements.lyric.value)
        .then((data) => {
          if (data === null) {
            console.log('error on post');
          } else {
            console.log('successfully added:');
            console.log(data);
          }
          this.props.onPinSubmittedResponse(data);
        })
        .catch((err) => {
          this.props.onPinSubmittedResponse(null);
        });
    }
  }

  render() {
    return (
      <Form
        noValidate
        validated={this.state.validated}
        onSubmit={e => this.handleSubmit(e)}
      >
        <Form.Group controlId="formPinTitle">
          <Form.Label>Track Title</Form.Label>
          <Form.Control required name="title" type="text" placeholder="Enter track title" />
          <Form.Control.Feedback type="invalid">
            The track title is required.
          </Form.Control.Feedback>
        </Form.Group>
        <Form.Group controlId="formPinArtist">
          <Form.Label>Artist</Form.Label>
          <Form.Control required name="artist" type="text" placeholder="Enter artist name" />
          <Form.Control.Feedback type="invalid">
            The artist name is required.
          </Form.Control.Feedback>
        </Form.Group>
        <Form.Group controlId="formPinLyric">
          <Form.Label>Lyric</Form.Label>
          <Form.Control required name="lyric" as="textarea" rows="2" placeholder="Enter the location-relevant portion of the lyrics" />
          <Form.Control.Feedback type="invalid">
            The location lyric is required.
          </Form.Control.Feedback>
        </Form.Group>
        <LoadingButton isLoading={this.state.isLoadingSubmissionResponse} variant="primary" />
      </Form>
    );
  }
}
