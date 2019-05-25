import React, {Component} from 'react';

import ManualAddPin from './ManualAddPin';
import SuggestionSearch from './SuggestionSearch';

import Modal from 'react-bootstrap/Modal'


export default class AddPinModal extends Component {

  constructor(props) {
    super(props);
    this.onShowSuggestionSearchClick = this.onShowSuggestionSearchClick.bind(this);
    this.onShowManualAddPinClick = this.onShowManualAddPinClick.bind(this);

    this.state = {
      showManualAddPin: false,
    };
  }

  // On a new pin add, reset to suggestedSearch
  componentDidUpdate(prevProps) {
    if (this.props.lat !== prevProps.lat) {
      this.setState({
        showManualAddPin: false,
      });
    }
  }

  onShowSuggestionSearchClick() {
    this.setState({
      showManualAddPin: false,
    });
  }

  onShowManualAddPinClick() {
    this.setState({
      showManualAddPin: true,
    });
  }

  render() {

    const manualAddPin = (
      <ManualAddPin onCloseAddPinModalClick={this.props.onCloseAddPinModalClick}
                    onPinSubmittedResponse={this.props.onPinSubmittedResponse}
                    lat={this.props.lat}
                    lng={this.props.lng}/>
    );

    const suggestionSearch = (
      <SuggestionSearch onCloseAddPinModalClick={this.onCloseAddPinModalClick}
                        onPinSubmittedResponse={this.props.onPinSubmittedResponse}
                        lat={this.props.lat}
                        lng={this.props.lng}/>
    );

    const switchToManual = (
      <div onClick={this.onShowManualAddPinClick}>
        Can't find the song you're looking for on spotify? Click here to add it manually
      </div>
    );

    const switchToSuggested = (
      <div onClick={this.onShowSuggestionSearchClick}>
        Want to search for the song on Spotify instead? Click here
      </div>
    );

    return(
      <Modal show={this.props.show} onHide={this.props.onCloseAddPinModalClick}>
        <Modal.Header closeButton>
          <Modal.Title id="add-pin-modal-title">
            Add a Pin 
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {this.state.showManualAddPin ? manualAddPin : suggestionSearch}
        </Modal.Body>
        <Modal.Footer>
          {this.state.showManualAddPin ? switchToSuggested : switchToManual}
        </Modal.Footer>
      </Modal>
    );
  }
}