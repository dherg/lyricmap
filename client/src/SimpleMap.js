import React, {Component} from 'react';

import GoogleMapReact from 'google-map-react';

import Pin from './Pin';

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
    this.getPins().then(data => {
      this.setState({
        pinList: data,
      });
      this.props.handlePinListUpdate(this.state.pinList);
    });
    console.log('this.state.pinList: ' + this.state.pinList);
  }

  getPins() {

    var url = process.env.REACT_APP_LYRICMAP_API_HOST + '/pins';

    var pinData;

    return fetch(url)
      .then(function(response) {
        if (response.status >= 400) {
          throw new Error("Bad response from server");
        }
        return response.json();
      })
      .then(function(data) {
        console.log('saving pinData time: ' + (new Date()).getTime());
        pinData = data;
        console.log(pinData);
        return data;
      });
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

    if (this.props.randomPin !== prevProps.randomPin && this.props.randomPin !== null) {
      this.handlePinClick(this.props.randomPin.PinID, this.props.randomPin.Lat, this.props.randomPin.Lng);
    }
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