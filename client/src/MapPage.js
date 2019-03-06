import React, {Component} from 'react';

import { fitBounds } from 'google-map-react/utils';

import AddPinWindow from './AddPinWindow';
import Header from './Header';
import MapBox from './MapBox';
import NamePrompt from './NamePrompt';

import { fetchPinInfo } from './App';

// the header + MapBox
export default class MapPage extends Component {

  constructor(props) {
    super(props);
    this.handleAddPinButton = this.handleAddPinButton.bind(this);
    this.handleAddPin = this.handleAddPin.bind(this);
    this.handleCloseAddPinWindowClick = this.handleCloseAddPinWindowClick.bind(this);
    this.handlePromptForName = this.handlePromptForName.bind(this);
    this.handleCloseNamePrompt = this.handleCloseNamePrompt.bind(this);
    this.handleRandomClick = this.handleRandomClick.bind(this);
    this.fetchPinDetails = this.fetchPinDetails.bind(this);

    // check if rendered as part of /pins/:id
    var pinID = this.props.match.params.id;
    console.log(pinID)
    if (typeof pinID !== "undefined" && pinID !== "") {
      console.log('got real pinID. fetching details')
      this.fetchPinDetails(pinID);
    }

    this.state = {
      center: null,
      mapwidth: null,
      mapheight: null,
      isAddingPin: false,
      showAddPinWindow: false,
      showNamePrompt: false,
      pinList: null,
      linkedPin: null,
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
    this.handleCloseAddPinWindowClick();

    this.setState({
      linkedPin: {
                    "PinID" : pinID, 
                    "Lat" : pinLat, 
                    "Lng" : pinLng
                 }
    });
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
      console.log('setting isAddingPin to true')
      this.setState({
        isAddingPin: true,
      });
    } else {
      // show popup saying you have to be logged in
      alert("You must be logged in to add a pin!")
    }
  }

  handleAddPin(lat, lng) {
    console.log("adding pin at " + lat + ", " + lng);
    this.setState({
      isAddingPin: false,
      showAddPinWindow: true,
      addingPinLat: lat,
      addingPinLng: lng,
    });
  }

  handleCloseAddPinWindowClick() {
    this.setState({
      isAddingPin: false,
      showAddPinWindow: false,
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

  render() {

    const addPinWindow = (
      <AddPinWindow onCloseAddPinWindowClick={this.handleCloseAddPinWindowClick} lat={this.state.addingPinLat} lng={this.state.addingPinLng}/>
    );

    const namePrompt = (
      <NamePrompt closeNamePrompt={this.handleCloseNamePrompt}/>
    );

    return(
      <div>
        <Header onMapPage={true} 
                changeMapCenter={(g) => this.changeMapCenter(g)} 
                handleAddPinButton={this.handleAddPinButton} 
                isAddingPin={this.state.isAddingPin} 
                handlePromptForName={this.handlePromptForName}
                handleRandomClick={this.handleRandomClick}
                pinList={this.state.pinList}/>
        <MapBox center={this.state.center} 
                zoom={this.state.zoom}
                setMapDimensions={(mapwidth, mapheight) => this.setMapDimensions(mapwidth, mapheight)}
                isAddingPin={this.state.isAddingPin}
                handleAddPin={(lat, lng) => this.handleAddPin(lat, lng)}
                handlePinListUpdate={(pinList) => this.handlePinListUpdate(pinList)}
                linkedPin={this.state.linkedPin}/>
        {this.state.showAddPinWindow ? addPinWindow : null}
        {this.state.showNamePrompt ? namePrompt : null}
      </div>
    );
  }
}