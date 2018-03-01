import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

// my imports
import GoogleMapReact from 'google-map-react';
import Pin from './Pin';
import { BrowserRouter as Router, Route, NavLink, IndexRoute, hashHistory, Switch } from 'react-router-dom';
import PropTypes from 'prop-types';

const AnyReactComponent = ({ text }) => <div>{text}</div>;

class About extends Component {
  render() {
    return (
      <div>
        <div className="AboutPage">
          About text here
        </div>
      </div>
    );
  }
}

class NotFound extends Component {
  render() {
    return (
      <div>
        Not Found
      </div>
    );
  }
}

// The map itself + pins
class SimpleMap extends Component {

  constructor(props) {
    super(props);
  }

  getPins() {
    return([
      {lat: 37.027718, lng: -95.625},
      {lat: 35.027718, lng: -95.625},
      {lat: 38.904510, lng: -77.050137}
    ]);
  }

  static defaultProps = {
    center: {lat: 35.027718, lng: -95.625},
    zoom: 5,
    pinCoords: [{lat: 37.027718, lng: -95.625}],
  };

  pinListToComponents(pinList) {
    return (
      pinList.map(pin => <Pin lat={pin.lat} lng={pin.lng} onPinClick={this.handlePinClick}/>)
    );
  }

  handlePinClick(clickedPin) {
    alert(clickedPin);
  }

  render() {

    var pinList = this.getPins();

    console.log(pinList);

    return (
      <div className="SimpleMap">

        <GoogleMapReact
          defaultCenter={this.props.center}
          defaultZoom={this.props.zoom}
          bootstrapURLKeys={{
            key: 'AIzaSyCIO-07Xg3QCEd3acooGm9trpH4kCZ5TTY',
            v: '3.30'
          }}
        >

          {this.pinListToComponents(pinList)}
        </GoogleMapReact>

      </div>
    );
  }
}

// Site header bar
class Header extends Component {
  render() {
    return (
      <div className="App-header">
        <div className="Logo-box">
          <div>
            <img src={logo} className="App-logo" alt="logo" />
          </div>
          <div>
            <h1 className="App-title">Lyric Map</h1>
          </div>
        </div>
        <div className="Header-link-box">
          <div className="Header-link">
            <NavLink to="random">Random</NavLink> 
          </div>
          <div className="Header-link">
            <NavLink to="about">About</NavLink> 
          </div>
          <div className="Header-link">
            <h3>Search-bar</h3>
          </div>
        </div>
      </div>
    ); // close return
  } // close render()
}

class InfoWindow extends Component {

  render() {
    return (
      <div>
        {this.props.clickedPin}
      </div>
    );
  }

}

// Everything under the header bar (map + pin info panels)
class MapBox extends Component {

  constructor(props) {
    super(props);

    this.state = {
      showInfoWindow : false,
      clickedPin : null,
    };
  }

  render() {

    const mapOnly = (
      <div>
        <SimpleMap />
      </div>
    )

    const infoWindow = (
      <div>
        <InfoWindow clickedPin={this.state.clickedPin} />
        <SimpleMap />
      </div>
    )

    return (
      this.state.showInfoWindow ? infoWindow : mapOnly
    );
  }
}

class AppRouter extends Component {
  render() {
    return (
      <Router>
        <div>
          <Header />
          <Switch>
            <Route path="/about" component={About} />
            <Route exact path="/" component={MapBox} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </Router>

    );
  }
}

export default AppRouter;
