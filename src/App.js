import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

// my imports
import GoogleMapReact from 'google-map-react';
import Pin from './Pin';
import { BrowserRouter as Router, Route, NavLink, IndexRoute, hashHistory, Switch } from 'react-router-dom';
import PropTypes from 'prop-types';

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
    this.handlePinClick = this.handlePinClick.bind(this);
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
      pinList.map(pin => <Pin lat={pin.lat} lng={pin.lng} text={pin.lat + pin.lng} onPinClick={this.handlePinClick}/>)
    );
  }

  handlePinClick(clickedPin) {
    this.props.onPinClick(clickedPin);
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

  constructor(props) {
    super(props);

    this.state = {
      spotifyembed: null,
      title: null,
      artist: null,
      album: null,
      year: null,
      lyrics: null,
      genre: null,
    };
  }

  componentDidMount() {
    // TODO: fetch pin info
    const spotifyembed = (
      <iframe src="https://open.spotify.com/embed/track/07gqJjvwwuZ1assFLKbiNn" width="250" height="80" frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe>
      );
    const title = "Dance Music";
    const artist = "The Mountain Goats";
    const album = "The Sunset Tree";
    const year = "2005";
    const lyrics = "Alright, I'm on Johnson Avenue in San Luis Obispo\nAnd I'm five years old, or six, maybe";
    const genre = "Alternative";

    this.setState({
      spotifyembed: spotifyembed,
      title: title,
      artist: artist,
      album: album,
      year: year,
      lyrics: lyrics,
      genre: genre,
    });
  }

  render() {
    return (
      <div id='InfoWindow'>
        <span id='CloseInfoWindow'
              onClick={() => this.props.onCloseInfoWindowClick()}>X</span>
        <div>
          {this.props.clickedPin}
        </div>
        <div>
          {this.state.spotifyembed}
        </div>
        <div>
          {this.state.title}
        </div>
        <div>
          {this.state.artist}
        </div>
        <div>
          {this.state.album}
        </div>
        <div>
          {this.state.year}
        </div>
        <div>
          {this.state.lyrics}
        </div>
        <div>
          {this.state.genre}
        </div>

      </div>
    );
  }

}

// Everything under the header bar (map + pin info panels)
class MapBox extends Component {

  constructor(props) {
    super(props);
    this.handlePinClick = this.handlePinClick.bind(this);
    this.handleCloseInfoWindowClick = this.handleCloseInfoWindowClick.bind(this);
    this.state = {
      showInfoWindow: false,
      clickedPin: null,
    };
  }

  handlePinClick(clickedPin) {
    this.setState({
      showInfoWindow: true,
      clickedPin: clickedPin,
    });
  }

  handleCloseInfoWindowClick() {
    this.setState({
      showInfoWindow: false,
      clickedPin: null,
    });
  }

  render() {

    // const boxMapOnly = (
    //   <div>
    //     <SimpleMap onPinClick={this.handlePinClick}/>
    //   </div>
    // )

    // const boxWithInfoWindow = (
    //   <div id="BoxWithInfoWindow">
    //     <InfoWindow clickedPin={this.state.clickedPin} 
    //                 onCloseInfoWindowClick={this.handleCloseInfoWindowClick}/>
    //     <SimpleMap onPinClick={this.handlePinClick}/>
    //   </div>
    // )

    const infoWindow = (
      <InfoWindow clickedPin={this.state.clickedPin} 
                  onCloseInfoWindowClick={this.handleCloseInfoWindowClick}/>
    )

    return (
      <div id="MapBoxWithInfoWindow">
        {this.state.showInfoWindow ? infoWindow : null}
        <SimpleMap onPinClick={this.handlePinClick}/>
      </div>

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
