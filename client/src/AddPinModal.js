import React, { Component } from 'react';

import Modal from 'react-bootstrap/Modal';
import SuggestionSearch from './SuggestionSearch';

export default class AddPinModal extends Component {
  render() {
    const suggestionSearch = (
      <SuggestionSearch
        onPinSubmittedResponse={this.props.onPinSubmittedResponse}
        lat={this.props.lat}
        lng={this.props.lng}
      />
    );

    return (
      <Modal show={this.props.show} onHide={this.props.onCloseAddPinModalClick}>
        <Modal.Header closeButton>
          <Modal.Title id="add-pin-modal-title">
            Add a Pin
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {suggestionSearch}
        </Modal.Body>
      </Modal>
    );
  }
}
