import React, { Component } from 'react';

import { fitBounds } from 'google-map-react/utils';

import About from './About';
import AddPinModal from './AddPinModal';
import Header from './Header';
import HeaderAlert from './HeaderAlert';
import MapBox from './MapBox';
import NamePrompt from './NamePrompt';
import UserPage from './UserPage';

import { fetchPinInfo } from './App';

// the header + MapBox
export default class MapPage extends Component {
  constructor(props) {
    super(props);
    this.handleAddPinButton = this.handleAddPinButton.bind(this);
    this.handleAddPin = this.handleAddPin.bind(this);
    this.handleCloseAddPinModalClick = this.handleCloseAddPinModalClick.bind(this);
    this.handlePinSubmittedResponse = this.handlePinSubmittedResponse.bind(this);
    this.handlePromptForName = this.handlePromptForName.bind(this);
    this.handleCloseNamePrompt = this.handleCloseNamePrompt.bind(this);
    this.handleRandomClick = this.handleRandomClick.bind(this);
    this.handleUpdateCurrentUser = this.handleUpdateCurrentUser.bind(this);
    this.fetchPinDetails = this.fetchPinDetails.bind(this);
    this.handleDismissMustBeSignedInAlert = this.handleDismissMustBeSignedInAlert.bind(this);
    this.handleDismissAddPinInstructionAlert = this.handleDismissAddPinInstructionAlert.bind(this);
    this.handleDismissPinSubmittedAlert = this.handleDismissPinSubmittedAlert.bind(this);
    this.handleToggleNavBarClick = this.handleToggleNavBarClick.bind(this);
    this.handleSearchSubmitClick = this.handleSearchSubmitClick.bind(this);
    this.handleShowInfoWindow = this.handleShowInfoWindow.bind(this);
    this.handleHideInfoWindow = this.handleHideInfoWindow.bind(this);


    this.state = {
      center: null,
      mapwidth: null,
      mapheight: null,
      isAddingPin: false,
      onAboutPage: false,
      showAddPinInstructionAlert: false,
      showAddPinModal: false,
      showInfoWindow: false,
      showMustBeSignedInAlert: false,
      showNamePrompt: false,
      showPinSubmittedAlert: false,
      pinList: null,
      pinSubmitResponse: null,
      linkedPin: null,
      linkedUser: null,
      currentUser: null,
    };

    // check if rendered as part of `/users/:id`
    const { path } = this.props.match;
    if (path === '/pins/:id' && this.props.match.params.id !== '') {
      this.fetchPinDetails(this.props.match.params.id);
    } else if (path === '/users/:id' && this.props.match.params.id !== '') {
      this.state.linkedUser = this.props.match.params.id;
    } else if (path === '/about') {
      this.state.onAboutPage = true;
    }
  }

  componentDidUpdate(prevProps) {
    const { path } = this.props.match;
    if (prevProps.match.path === path && prevProps.match.params.id === this.props.match.params.id) {
      return;
    }

    switch (path) {
      case '/': {
        this.setState({
          linkedPin: null,
          linkedUser: null,
          isAddingPin: false,
          onAboutPage: false,
        });
        break;
      }
      case '/pins/:id': {
        const pinID = this.props.match.params.id;
        if (typeof pinID !== 'undefined' && pinID !== '') {
          this.setState({
            linkedUser: null,
            isAddingPin: false,
            onAboutPage: false,
          });
          this.fetchPinDetails(pinID);
        }
        break;
      }
      case '/users/:id': {
        const userID = this.props.match.params.id;
        if (typeof userID !== 'undefined' && userID !== '') {
          this.setState({
            linkedPin: null,
            linkedUser: userID,
            isAddingPin: false,
            onAboutPage: false,
          });
        }
        break;
      }
      case '/about': {
        this.setState({
          linkedPin: null,
          linkedUser: null,
          isAddingPin: false,
          onAboutPage: true,
        });
        break;
      }
      default: {
        break;
      }
    }
  }

  setMapDimensions(mapwidth, mapheight) {
    this.setState({
      mapwidth,
      mapheight,
    });
  }

  linkToPin(pinID, pinLat, pinLng) {
    // close other windows
    this.handleCloseNamePrompt();
    this.handleCloseAddPinModalClick();

    // update state with linkedPin and close any alerts
    this.setState({
      linkedPin: {
        PinID: pinID,
        Lat: pinLat,
        Lng: pinLng,
      },
      showAddPinInstructionAlert: false,
      showAddPinModal: false,
      showPinSubmittedAlert: false,
      showMustBeSignedInAlert: false,
      showInfoWindow: true,
    });
    this.props.history.push(`/pins/${pinID}`);
  }

  fetchPinDetails(pinID) {
    const that = this;
    fetchPinInfo(pinID).then((result) => {
      // result will be null in case of 404
      if (result !== null) {
        that.linkToPin(result.pinID, result.lat, result.lng);
      }
    });
  }

  changeMapCenter(geometry) {
    const boundsNE = geometry.viewport.getNorthEast();
    const boundsSW = geometry.viewport.getSouthWest();
    const bounds = {
      ne: {
        lat: boundsNE.lat(),
        lng: boundsNE.lng(),
      },
      sw: {
        lat: boundsSW.lat(),
        lng: boundsSW.lng(),
      },
    };

    const size = {
      width: this.state.mapwidth,
      height: this.state.mapheight,
    };

    const { center, zoom } = fitBounds(bounds, size);

    this.setState({
      center,
      zoom,
    });
  }

  handleAddPinButton() {
    // check if user is logged in or not before allowing them to add pin
    if (window.globalCurrentUser.userID !== null) {
      this.setState({
        isAddingPin: true,
        showAddPinInstructionAlert: true,
        showInfoWindow: false,
        onAboutPage: false,
      });
    } else {
      // show popup saying you have to be logged in
      this.setState({
        showMustBeSignedInAlert: true,
      });
    }
  }

  handleAddPin(lat, lng) {
    this.setState({
      isAddingPin: false,
      showAddPinModal: true,
      showAddPinInstructionAlert: false,
      addingPinLat: lat,
      addingPinLng: lng,
    });
  }

  handleCloseAddPinModalClick() {
    this.setState({
      isAddingPin: false,
      showAddPinModal: false,
    });
  }

  handlePinSubmittedResponse(response) {
    this.setState({
      isAddingPin: false,
      showAddPinModal: false,
      showPinSubmittedAlert: true,
      pinSubmitResponse: response,
    });
  }

  handlePromptForName() {
    this.setState({
      showNamePrompt: true,
      showInfoWindow: false,
    });
  }

  handleCloseNamePrompt() {
    this.setState({
      showNamePrompt: false,
    });
  }

  handlePinListUpdate(pinList) {
    this.setState({
      pinList,
    });
  }

  handleRandomClick() {
    if (this.state.pinList === null || this.state.pinList.length === 0) {
      return;
    }

    // choose random pin from this.state.pinList
    const randomPin = this.state.pinList[Math.floor(Math.random() * this.state.pinList.length)];

    this.linkToPin(randomPin.PinID, randomPin.Lat, randomPin.Lng);
  }

  handleUpdateCurrentUser(newUser) {
    this.setState({
      currentUser: newUser,
    });
  }

  handleDismissMustBeSignedInAlert() {
    this.setState({
      showMustBeSignedInAlert: false,
    });
  }

  handleDismissAddPinInstructionAlert() {
    this.setState({
      showAddPinInstructionAlert: false,
    });
  }

  handleDismissPinSubmittedAlert() {
    this.setState({
      showPinSubmittedAlert: false,
    });
  }

  // When navBar collapse toggle is clicked on, hide alerts
  handleToggleNavBarClick() {
    this.setState({
      showPinSubmittedAlert: false,
      showAddPinInstructionAlert: false,
      showMustBeSignedInAlert: false,
    });
  }

  // On search submit button click, close InfoWindow
  handleSearchSubmitClick() {
    this.setState({
      showInfoWindow: false,
      onAboutPage: false,
    });
  }

  handleShowInfoWindow() {
    this.setState({
      showInfoWindow: true,
    });
  }

  handleHideInfoWindow() {
    this.setState({
      showInfoWindow: false,
    });
  }

  render() {
    const pinAddedSuccessMessage = 'Pin added!';
    const pinAddedErrorMessage = 'Error submitting pin, please try again later.';

    const mapPage = (
      <div id="Map-Page">
        <Header
          onMapPage
          changeMapCenter={g => this.changeMapCenter(g)}
          handleAddPinButton={this.handleAddPinButton}
          isAddingPin={this.state.isAddingPin}
          handlePromptForName={this.handlePromptForName}
          handleRandomClick={this.handleRandomClick}
          pinList={this.state.pinList}
          onToggleNavBarClick={this.handleToggleNavBarClick}
          onSearchSubmitClick={this.handleSearchSubmitClick}
        />
        <HeaderAlert
          onClose={this.handleDismissMustBeSignedInAlert}
          show={this.state.showMustBeSignedInAlert}
          variant="danger"
          message="You must be signed in to add a pin."
        />
        <HeaderAlert
          onClose={this.handleDismissAddPinInstructionAlert}
          show={this.state.showAddPinInstructionAlert}
          variant="primary"
          message="Click on the map at the exact location the song references to add a pin."
        />
        <HeaderAlert
          onClose={this.handleDismissPinSubmittedAlert}
          show={this.state.showPinSubmittedAlert}
          variant={this.state.pinSubmitResponse === null ? 'danger' : 'info'}
          message={this.state.pinSubmitResponse === null ? pinAddedErrorMessage : pinAddedSuccessMessage}
        />
        <MapBox
          center={this.state.center}
          zoom={this.state.zoom}
          setMapDimensions={(mapwidth, mapheight) => this.setMapDimensions(mapwidth, mapheight)}
          isAddingPin={this.state.isAddingPin}
          handleAddPin={(lat, lng) => this.handleAddPin(lat, lng)}
          handlePinListUpdate={pinList => this.handlePinListUpdate(pinList)}
          linkedPin={this.state.linkedPin}
          show={this.state.showInfoWindow}
          showInfoWindow={this.handleShowInfoWindow}
          hideInfoWindow={this.handleHideInfoWindow}
          addedPins={this.state.pinSubmitResponse}
        />
        <AddPinModal
          show={this.state.showAddPinModal}
          onCloseAddPinModalClick={this.handleCloseAddPinModalClick}
          onPinSubmittedResponse={this.handlePinSubmittedResponse}
          lat={this.state.addingPinLat}
          lng={this.state.addingPinLng}
        />
        <NamePrompt show={this.state.showNamePrompt} closeNamePrompt={this.handleCloseNamePrompt} />

      </div>
    );

    const userPage = (
      <div>
        <Header
          handleUpdateCurrentUser={this.handleUpdateCurrentUser}
          handlePromptForName={this.handlePromptForName}
          onToggleNavBarClick={this.handleToggleNavBarClick}
        />
        <UserPage userID={this.state.linkedUser} currentUser={this.state.currentUser} />
        <NamePrompt show={this.state.showNamePrompt} closeNamePrompt={this.handleCloseNamePrompt} />
      </div>
    );

    const aboutPage = (
      <div>
        <Header
          changeMapCenter={g => this.changeMapCenter(g)}
          handleUpdateCurrentUser={this.handleUpdateCurrentUser}
          handleAddPinButton={this.handleAddPinButton}
          isAddingPin={this.state.isAddingPin}
          pinList={this.state.pinList}
          handlePromptForName={this.handlePromptForName}
          handleRandomClick={this.handleRandomClick}
          onToggleNavBarClick={this.handleToggleNavBarClick}
          onSearchSubmitClick={this.handleSearchSubmitClick}
          onAboutPage
        />
        <HeaderAlert
          onClose={this.handleDismissMustBeSignedInAlert}
          show={this.state.showMustBeSignedInAlert}
          variant="danger"
          message="You must be signed in to add a pin."
        />
        <About />
      </div>
    );

    if (this.state.onAboutPage) {
      return (aboutPage);
    } if (this.state.linkedUser !== null) {
      return (userPage);
    }
    return mapPage;
  }
}
