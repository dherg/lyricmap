import React, {Component} from 'react';

import { fitBounds } from 'google-map-react/utils';

import AddPinWindow from './AddPinWindow';
import Header from './Header';
import MapBox from './MapBox';
import NamePrompt from './NamePrompt';

// the header + MapBox
export default class MapPage extends Component {

  constructor(props) {
    super(props);
    this.handleAddPinButton = this.handleAddPinButton.bind(this);
    this.handleAddPin = this.handleAddPin.bind(this);
    this.handleCloseAddPinWindowClick = this.handleCloseAddPinWindowClick.bind(this);
    this.handlePromptForName = this.handlePromptForName.bind(this);
    this.handleCloseNamePrompt = this.handleCloseNamePrompt.bind(this);

    this.state = {
      center: null,
      mapwidth: null,
      mapheight: null,
      isAddingPin: false,
      showAddPinWindow: false,
      showNamePrompt: false
    }
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

  render() {

    const addPinWindow = (
      <AddPinWindow onCloseAddPinWindowClick={this.handleCloseAddPinWindowClick} lat={this.state.addingPinLat} lng={this.state.addingPinLng}/>
    );

    const namePrompt = (
      <NamePrompt closeNamePrompt={this.handleCloseNamePrompt}/>
    );

    return(
      <div>
        <Header onMapPage={true} changeMapCenter={(g) => this.changeMapCenter(g)} handleAddPinButton={this.handleAddPinButton} isAddingPin={this.state.isAddingPin} handlePromptForName={this.handlePromptForName}/>
        <MapBox center={this.state.center} 
                zoom={this.state.zoom}
                setMapDimensions={(mapwidth, mapheight) => this.setMapDimensions(mapwidth, mapheight)}
                isAddingPin={this.state.isAddingPin}
                handleAddPin={(lat, lng) => this.handleAddPin(lat, lng)}/>
        {this.state.showAddPinWindow ? addPinWindow : null}
        {this.state.showNamePrompt ? namePrompt : null}
      </div>
    );
  }
}