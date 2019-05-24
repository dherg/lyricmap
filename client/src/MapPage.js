import React, {Component} from 'react';

import { fitBounds } from 'google-map-react/utils';

import AddPinModal from './AddPinModal';
import Header from './Header';
import HeaderAlert from './HeaderAlert';
import MapBox from './MapBox';
import NamePrompt from './NamePrompt';
import UserPage from './UserPage';

import { fetchPinInfo } from './App';

import Alert from 'react-bootstrap/Alert'

// the header + MapBox
export default class MapPage extends Component {

  constructor(props) {
    super(props);
    this.handleAddPinButton = this.handleAddPinButton.bind(this);
    this.handleAddPin = this.handleAddPin.bind(this);
    this.handleCloseAddPinModalClick = this.handleCloseAddPinModalClick.bind(this);
    this.handlePinSubmitted = this.handlePinSubmitted.bind(this);
    this.handlePromptForName = this.handlePromptForName.bind(this);
    this.handleCloseNamePrompt = this.handleCloseNamePrompt.bind(this);
    this.handleRandomClick = this.handleRandomClick.bind(this);
    this.handleUpdateCurrentUser = this.handleUpdateCurrentUser.bind(this);
    this.fetchPinDetails = this.fetchPinDetails.bind(this);
    this.handleDismissMustBeSignedInAlert = this.handleDismissMustBeSignedInAlert.bind(this);
    this.handleDismissAddPinInstructionAlert = this.handleDismissAddPinInstructionAlert.bind(this);
    this.handleDismissPinSubmittedAlert = this.handleDismissPinSubmittedAlert.bind(this);

    this.state = {
      center: null,
      mapwidth: null,
      mapheight: null,
      isAddingPin: false,
      showAddPinInstructionAlert: false, 
      showAddPinModal: false,
      showMustBeSignedInAlert: false,
      showNamePrompt: false,
      showPinSubmittedAlert: false, 
      pinList: null,
      linkedPin: null,
      linkedUser: null,
      currentUser: null,
    }

    // check if rendered as part of `/users/:id`
    var path = this.props.match.path;
    if (path === "/pins/:id" && this.props.match.params.id !== "") {
      console.log('got real pinID. fetching details')
      this.fetchPinDetails(this.props.match.params.id);
    } else if (path === "/users/:id" && this.props.match.params.id !== "") {
      console.log('got real userID')
      this.state.linkedUser = this.props.match.params.id;
    }

  }

  componentDidUpdate(prevProps) {

    var path = this.props.match.path;
    if (prevProps.match.path === path && prevProps.match.params.id == this.props.match.params.id) {
      return;
    }

    switch (path) {
      case "/":
        console.log('reset to root')
        this.setState({
          linkedPin: null,
          linkedUser: null,
          isAddingPin: false
        })
        break;
      case "/pins/:id":
        var pinID = this.props.match.params.id;
        console.log('pinID, ', pinID);
        if (typeof pinID !== "undefined" && pinID != "") {
          console.log('component updated with real pinID. fetching details')
          this.setState({
            linkedUser: null,
            isAddingPin: false,
          })
          this.fetchPinDetails(pinID);
        }
        break;
      case "/users/:id":
        var userID = this.props.match.params.id;
        console.log('userID, ', userID);
        if (typeof userID !== "undefined" && userID != "") {
          console.log('Real pinID. fetching details')
          this.setState({
            linkedPin: null,
            linkedUser: userID,
            isAddingPin: false,
          })
        }
    }
  }

  fetchPinDetails(pinID) {
    var that = this;
    fetchPinInfo(pinID).then(function(result) {
      // result will be null in case of 404
      if (result == null) {
        return
      } else {
        that.linkToPin(result.pinID, result.lat, result.lng);
      }
    });
  }

  linkToPin(pinID, pinLat, pinLng) {

    // close other windows 
    this.handleCloseNamePrompt();
    this.handleCloseAddPinModalClick();

    this.setState({
      linkedPin: {
                    "PinID" : pinID, 
                    "Lat" : pinLat, 
                    "Lng" : pinLng
                 }
    });
    this.props.history.push('/pins/' + pinID);
  }

  setMapDimensions(mapwidth, mapheight) {
    this.setState({
      mapwidth: mapwidth,
      mapheight: mapheight,
    });
  }

  changeMapCenter(geometry) {
    var bounds_ne = geometry.viewport.getNorthEast();
    var bounds_sw = geometry.viewport.getSouthWest();
    const bounds = {
      ne: {
        lat: bounds_ne.lat(),
        lng: bounds_ne.lng(),
      },
      sw: {
        lat: bounds_sw.lat(),
        lng: bounds_sw.lng(),
      }
    }

    const size = {
      width: this.state.mapwidth,
      height: this.state.mapheight
    }

    const {center, zoom} = fitBounds(bounds, size)

    this.setState({
      center: center,
      zoom: zoom,
    })
  }

  handleAddPinButton() {
    // check if user is logged in or not before allowing them to add pin
    if (window.globalCurrentUser.userID !== null) {
      this.setState({
        isAddingPin: true,
        showAddPinInstructionAlert: true,
      });
    } else {
      // show popup saying you have to be logged in
      this.setState({
        showMustBeSignedInAlert: true,
      });
    }
  }

  handleAddPin(lat, lng) {
    console.log("adding pin at " + lat + ", " + lng);
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

  handlePinSubmitted() {
    this.setState({
      isAddingPin: false,
      showAddPinModal: false,
      showPinSubmittedAlert: true,
    });
  }

  handlePromptForName() {
    this.setState({
      showNamePrompt: true,
    })
  }

  handleCloseNamePrompt() {
    this.setState({
      showNamePrompt: false
    })
  }

  handlePinListUpdate(pinList) {
    this.setState({
      pinList: pinList,
    });
  }

  handleRandomClick() {
    if (this.state.pinList === null || this.state.pinList.length === 0 ){
      return;
    }

    // choose random pin from this.state.pinList 
    var randomPin = this.state.pinList[Math.floor(Math.random() * this.state.pinList.length)];

    this.linkToPin(randomPin.PinID, randomPin.Lat, randomPin.Lng);
  }

  handleUpdateCurrentUser(newUser) {
    this.setState({
      currentUser: newUser,
    })
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


  render() {

    const mapPage = (
      <div>
        <Header onMapPage={true} 
                changeMapCenter={(g) => this.changeMapCenter(g)} 
                handleAddPinButton={this.handleAddPinButton} 
                isAddingPin={this.state.isAddingPin} 
                handlePromptForName={this.handlePromptForName}
                handleRandomClick={this.handleRandomClick}
                pinList={this.state.pinList}/>
        <HeaderAlert onClose={this.handleDismissMustBeSignedInAlert}
                     show={this.state.showMustBeSignedInAlert}
                     variant="danger"
                     message="You must be signed in to add a pin."/>
        <HeaderAlert onClose={this.handleDismissAddPinInstructionAlert}
                     show={this.state.showAddPinInstructionAlert}
                     variant="primary"
                     message="Click on the map at the exact location the song references to add a pin."/>
        <HeaderAlert onClose={this.handleDismissPinSubmittedAlert}
                     show={this.state.showPinSubmittedAlert}
                     variant="info"
                     message="Pin submitted! (Refresh to view)"/>
        <MapBox center={this.state.center} 
                zoom={this.state.zoom}
                setMapDimensions={(mapwidth, mapheight) => this.setMapDimensions(mapwidth, mapheight)}
                isAddingPin={this.state.isAddingPin}
                handleAddPin={(lat, lng) => this.handleAddPin(lat, lng)}
                handlePinListUpdate={(pinList) => this.handlePinListUpdate(pinList)}
                linkedPin={this.state.linkedPin}/>
        <AddPinModal show={this.state.showAddPinModal} 
                     onCloseAddPinModalClick={this.handleCloseAddPinModalClick}
                     onPinSubmitted={this.handlePinSubmitted}
                     lat={this.state.addingPinLat}
                     lng={this.state.addingPinLng}/>
        <NamePrompt show={this.state.showNamePrompt} closeNamePrompt={this.handleCloseNamePrompt}/>

      </div>
    );

    const userPage = (
      <div>
        <Header handleUpdateCurrentUser={this.handleUpdateCurrentUser}
                handlePromptForName={this.handlePromptForName}/>
        <UserPage userID={this.state.linkedUser} currentUser={this.state.currentUser}/>
        <NamePrompt show={this.state.showNamePrompt} closeNamePrompt={this.handleCloseNamePrompt}/>
      </div>
    );

    if (this.state.linkedUser !== null) {
      return(userPage)
    } else {
      return mapPage
    }

  }
}