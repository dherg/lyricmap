import React, { Component } from 'react';

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
      center: { lat: 35.027718, lng: -95.625 },
      zoom: 4.5,
      pinList: null,
    };
  }

  componentDidMount() {
    getPins().then((data) => {
      this.setState({
        pinList: data,
      });
      this.props.handlePinListUpdate(this.state.pinList);
    });
  }

  componentDidUpdate(prevProps) {
    if (this.props.linkedPin !== prevProps.linkedPin && this.props.linkedPin !== null) {
      this.handlePinClick(this.props.linkedPin.PinID, this.props.linkedPin.Lat, this.props.linkedPin.Lng);
    }
    if (this.props.addedPins !== prevProps.addedPins) {
      const joinedPinList = this.state.pinList.concat(this.props.addedPins);
      this.setState({
        pinList: joinedPinList,
      });
    }
    if (this.props.center !== prevProps.center || this.props.zoom !== prevProps.zoom) {
      this.setState({
        center: this.props.center,
        zoom: this.props.zoom,
      });
    }
  }

  pinListToComponents(pinList) {
    if (pinList === null) {
      return null;
    }
    return (
      pinList.map(pin => (
        <Pin
          key={pin.PinID}
          pinID={pin.PinID}
          lat={Number(pin.Lat)}
          lng={Number(pin.Lng)}
          text={String(pin.Lat + pin.Lng)}
          onPinClick={this.handlePinClick}
        />
      ))
    );
  }

  handlePinClick(clickedPinID, clickedPinLat, clickedPinLng) {
    // open InfoWindow
    this.props.onPinClick(clickedPinID);

    // Center the clicked pin in the map
    this.setState({
      center: { lat: clickedPinLat, lng: clickedPinLng },
    });
  }

  addPin(event) {
    // Make sure that this isn't a click on google maps controls
    // by checking the event target className
    const eventTarget = event.event.nativeEvent.target.className;

    if (this.props.isAddingPin && eventTarget !== 'gm-control-active') {
      this.props.handleAddPin(event.lat, event.lng);
    }
  }

  createMapOptions() {
    return ({
      streetViewControl: true,
      mapTypeControl: true,
      gestureHandling: 'greedy',
      styles: [
        {
          featureType: 'landscape',
          stylers: [
            {
              hue: '#FFBB00',
            },
            {
              saturation: 43.400000000000006,
            },
            {
              lightness: 37.599999999999994,
            },
            {
              gamma: 1,
            },
          ],
        },
        {
          featureType: 'road.highway',
          stylers: [
            {
              hue: '#FFC200',
            },
            {
              saturation: -61.8,
            },
            {
              lightness: 0,
            },
            {
              gamma: 1,
            },
          ],
        },
        {
          featureType: 'road.arterial',
          stylers: [
            {
              hue: '#FF0300',
            },
            {
              saturation: -100,
            },
            {
              lightness: 0,
            },
            {
              gamma: 1,
            },
          ],
        },
        {
          featureType: 'road.local',
          stylers: [
            {
              hue: '#FF0300',
            },
            {
              saturation: -100,
            },
            {
              lightness: 0,
            },
            {
              gamma: 1,
            },
          ],
        },
        {
          featureType: 'water',
          stylers: [
            {
              hue: '#0078FF',
            },
            {
              saturation: -13.200000000000003,
            },
            {
              lightness: 2.4000000000000057,
            },
            {
              gamma: 1,
            },
          ],
        },
        {
          featureType: 'poi',
          stylers: [
            {
              hue: '#00FF6A',
            },
            {
              saturation: -1.0989010989011234,
            },
            {
              lightness: 11.200000000000017,
            },
            {
              gamma: 1,
            },
          ],
        },
      ],
    });
  }

  render() {
    
    const pinComponents = this.pinListToComponents(this.state.pinList);

    return (
      <div className="SimpleMap">
        <GoogleMapReact
          center={this.state.center}
          zoom={this.state.zoom}
          bootstrapURLKeys={{
            key: GOOGLE_KEY,
            v: '3.30',
          }}
          onClick={this.addPin}
          options={this.createMapOptions}
        >
          {pinComponents}
        </GoogleMapReact>
      </div>
    );
  }
}
