import React, {Component} from 'react';

import GoogleMapReact from 'google-map-react';

import Pin from './Pin';

import { getPins } from './App';

const GOOGLE_KEY = process.env.REACT_APP_GOOGLE_KEY;

// The map itself + pins
export default class SimpleMap extends Component {

  constructor(props) {
    super(props);
    this.handlePinClick = this.handlePinClick.bind(this);
    this.addPin = this.addPin.bind(this);
    this.state = {
      center: {lat: 35.027718, lng: -95.625},
      zoom: 5,
      pinList: null,
    }
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.center !== nextProps.center) {
      this.setState({
        center: nextProps.center,
      });
    }
    if (this.props.zoom !== nextProps.zoom) {
      this.setState({
        zoom: nextProps.zoom,
      })
    }
  }

  componentDidMount() {
    getPins().then(data => {
      this.setState({
        pinList: data,
      });
      this.props.handlePinListUpdate(this.state.pinList);
    });
    console.log('this.state.pinList: ' + this.state.pinList);
  }

  pinListToComponents(pinList) {
    if (pinList === null) {
      return;
    } else {
      return (
        pinList.map(pin => <Pin key={pin.PinID} pinID={pin.PinID} lat={Number(pin.Lat)} lng={Number(pin.Lng)} text={String(pin.Lat + pin.Lng)} onPinClick={this.handlePinClick}/>)
      );
    }
  }

  handlePinClick(clickedPinID, clickedPinLat, clickedPinLng) {
    console.log("clickedPinID,clickedPinLat,clickedPinLng ", clickedPinID, clickedPinLat, clickedPinLng);
    // open InfoWindow
    this.props.onPinClick(clickedPinID);

    // set clicked pin to center
    this.setState({
      center: {lat: clickedPinLat, lng: clickedPinLng},
    })
  }

  addPin(event) {
    if (this.props.isAddingPin) {
      this.props.handleAddPin(event.lat, event.lng);
    }
  }

  componentDidUpdate(prevProps) {

    if (this.props.linkedPin !== prevProps.linkedPin && this.props.linkedPin !== null) {
      this.handlePinClick(this.props.linkedPin.PinID, this.props.linkedPin.Lat, this.props.linkedPin.Lng);
    } 
    // else if (this.props.linkedPin !== prevProps.linkedPin && this.props.linkedPin == null) {
    //   this.props.closeInfoWindow();
    // }
  }

  render() {

    return (
      <div className="SimpleMap">

        <GoogleMapReact
          center={this.state.center}
          zoom={this.state.zoom}
          bootstrapURLKeys={{
            key: GOOGLE_KEY,
            v: '3.30'
          }}
          onClick={this.addPin}
          options={{streetViewControl: true}}
        >

          {this.pinListToComponents(this.state.pinList)}
        </GoogleMapReact>

      </div>
    );
  }
}