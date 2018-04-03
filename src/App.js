import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

// my imports
import GoogleMapReact from 'google-map-react';
import Pin from './Pin';
import { BrowserRouter as Router, Route, NavLink, IndexRoute, hashHistory, Switch } from 'react-router-dom';
import PropTypes from 'prop-types';

const google = window.google;
const GOOGLE_KEY = 'AIzaSyCIO-07Xg3QCEd3acooGm9trpH4kCZ5TTY';

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
    this.state = {
      center: {lat: 35.027718, lng: -95.625},
      zoom: 5,
      pinList: null,
    }
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.center != nextProps.center) {
      this.setState({
        center: nextProps.center,
      });
    }
  }

  componentDidMount() {
    this.setState({
      pinList: this.getPins(),
    });
  }

  getPins() {
    // TODO: make api call
    return([
      {lat: 37.027718, lng: -95.625},
      {lat: 35.027718, lng: -95.625},
      {lat: 38.904510, lng: -77.050137}
    ]);
  }

  pinListToComponents(pinList) {
    return (
      pinList.map(pin => <Pin lat={pin.lat} lng={pin.lng} text={pin.lat + pin.lng} onPinClick={this.handlePinClick}/>)
    );
  }

  handlePinClick(clickedPinLat, clickedPinLng) {
    console.log("clickedPin", clickedPinLat, clickedPinLng);
    // open InfoWindow
    this.props.onPinClick(clickedPinLat);

    // set clicked pin to center
    this.setState({
      center: {lat: clickedPinLat, lng: clickedPinLng},
    })
  }

  addPin(x, y, lat, lng, event) {
    console.log('addPin: ', x, y, lat, lng, event);
  }

  render() {

    var pinList = this.getPins();

    console.log(pinList);

    return (
      <div className="SimpleMap">

        <GoogleMapReact
          defaultCenter={this.state.center}
          defaultZoom={this.state.zoom}
          center={this.state.center}
          bootstrapURLKeys={{
            key: GOOGLE_KEY,
            v: '3.30'
          }}
          onClick={this.addPin}
        >

          {this.pinListToComponents(pinList)}
        </GoogleMapReact>

      </div>
    );
  }
}

// Search bar
class SearchBar extends Component {

  constructor(props) {
    super(props);
    this.geocodeAddress = this.geocodeAddress.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);

    this.state = {
      text: 'Enter location',
    }
  }

  // componentDidMount() {

  //   var geocoder = new google.maps.Geocoder();

  //   // document.getElementById('submit').addEventListener('click', function() {
  //   //   this.geocodeAddress(geocoder);
  //   // });
  // }

  geocodeAddress(address) {
    var geocoder = new google.maps.Geocoder();
    var address = document.getElementById('address').value;
    geocoder.geocode({'address': address}, function(results, status) {
      console.log('Results: ' + results[0]);
      if (status == 'OK') {
        console.log('status OK. results: ' + console.log(results[0].formatted_address));
        // TODO: set center of map here
        // map.setCenter(results[0].geometry.location);
        return(results[0].geometry.location)
      } else {
        console.log('Geocode was not successful. ')
        console.log('Status: ' + status);
        return(null)
      }
    }); 
  }

  // handle change in text box
  handleChange(event) {
    this.setState({text: event.target.value});
  }

  // handle clicking the "submit" button
  handleSubmit() {
    var location = this.geocodeAddress(this.state.text); // location = results[0].geometry.location
    console.log('geocoded');
    if (location != null) {
      // set center of the map to the location
      this.props.changeMapCenter(location);
    } else {
      // TODO: display try a different search message
      console.log('ERROR: TRY DIFFERENT SEARCH')
    }

  }


  render() {
    return(
      <div id="floating-panel">
        <input id="address" type="textbox" value={this.state.text} onChange={this.handleChange}/>
        <input id="submit" type="button" value="Search" onClick={this.handleSubmit}/>
      </div>
    )
  }
}

// Site header bar
class Header extends Component {

  constructor(props) {
    super(props);
  }

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
          <SearchBar changeMapCenter={this.props.changeMapCenter}/>
        </div>
      </div>
    ); // close return
  } // close render()
}

// side panel with info about clicked pin
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
        <div id='PinLyrics'>
          " {this.state.lyrics} "
        </div>
        <div id='SpotifyEmbed'>
          {this.state.spotifyembed}
        </div>
        <div id='PinTitle'>
          {this.state.title}
        </div>
        <div id='PinArtist'>
          by <b>{this.state.artist}</b>
        </div>
        <div class="PinDetail">
          Album: <b>{this.state.album}</b>
        </div>
        <div class="PinDetail">
          Year: <b>{this.state.year}</b>
        </div>
        <div class="PinDetail">
          Genre: <b>{this.state.genre}</b>
        </div>
        <div class="PinDetail">
          PinID: {this.props.clickedPin}
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

  // componentWillReceiveProps(nextProps) {
  //   if nextProps.center != this.props.center {

  //   }
  // }

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

    const infoWindow = (
      <InfoWindow clickedPin={this.state.clickedPin} 
                  onCloseInfoWindowClick={this.handleCloseInfoWindowClick}/>
    )

    return (
      <div id="MapBoxWithInfoWindow">
        {this.state.showInfoWindow ? infoWindow : null}
        <SimpleMap onPinClick={this.handlePinClick} 
                   center={this.props.center}/>
      </div>
    );
  }
}

// the header + MapBox
class MapPage extends Component {

  constructor(props) {
    super(props);

    this.state = {
      center: null,
    }
  }

  changeMapCenter(location) {
    // TODO
    this.setState({
      center: location,
    })
  }

  render() {
    return(
      <div>
        <Header changeMapCenter={this.changeMapCenter}/>
        <MapBox center={this.state.center}/>
      </div>
    );
  }
}

class AppRouter extends Component {

  render() {
    return (
      <Router>
        <div>
          <Switch>
            <Route path="/about" component={About} />
            <Route exact path="/" component={MapPage} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </Router>

    );
  }
}

export default AppRouter;
