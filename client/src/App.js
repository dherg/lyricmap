import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

// my imports
import GoogleMapReact from 'google-map-react';
import { fitBounds } from 'google-map-react/utils';
import Pin from './Pin';
import { BrowserRouter as Router, Route, NavLink, Switch } from 'react-router-dom';
import PropTypes from 'prop-types';
import Autosuggest from 'react-autosuggest';
import debounce from 'lodash/debounce';

const google = window.google;
const GOOGLE_KEY = 'AIzaSyCIO-07Xg3QCEd3acooGm9trpH4kCZ5TTY';

// POST a pin with optional metadata
// lat, lng, title, artist, and lyric are mandatory for all pins
// spotifyID, album, year, genre, are optional
function postPin(lat, lng, title, artist, lyric, spotifyID=null, album=null, year=null, genre=null) {

  // check if mandatory parameters are 
  if (lat === null || lng === null || title === null || artist === null || lyric === null) {
    throw new Error('One or more of lat, lng, title, artist, or lyric were null. Not posting pin.');
  }
  
  // get url for environment 
  var url = 'http://' + process.env.REACT_APP_LYRICMAP_API_HOST + '/pins';

  fetch(url, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      lat: lat,
      lng: lng,
      title: title,
      artist: artist,
      lyric: lyric,
      spotifyID: (spotifyID === null ? undefined : spotifyID),
      album: (album === null ? undefined : album),
      year: (year === null ? undefined : year),
      genre: (genre === null ? undefined : genre),
    })
  });

}

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
    });
    console.log('this.state.pinList: ' + this.state.pinList);
  }

  getPins() {

    var url = 'http://' + process.env.REACT_APP_LYRICMAP_API_HOST + '/pins';

    var pinData;

    return fetch(url)
      .then(function(response) {
        if (response.status >= 400) {
          throw new Error("Bad response from server");
        }
        return response.json();
      })
      .then(function(data) {
        console.log('saving pinData time: ' + (new Date).getTime());
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
        pinList.map(pin => <Pin key={pin.PinId} pinId={pin.PinId} lat={Number(pin.Lat)} lng={Number(pin.Lng)} text={String(pin.Lat + pin.Lng)} onPinClick={this.handlePinClick}/>)
      );
    }
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

  addPin(event) {
    if (this.props.isAddingPin) {
      this.props.handleAddPin(event.lat, event.lng);
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

// Search bar
class SearchBar extends Component {

  constructor(props) {
    super(props);

    this.changeMapCenter = this.changeMapCenter.bind(this);
    this.geocodeAddress = this.geocodeAddress.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);

    this.state = {
      text: '',
    }
  }

  // take in geometry object and update the map center with .location and .viewport
  changeMapCenter(geometry) {
    this.props.changeMapCenter(geometry);
  }

  // handle change in text box
  handleChange(event) {
    this.setState({text: event.target.value});
  }

  geocodeAddress(address) {
    var geocoder = new google.maps.Geocoder();

    geocoder.geocode({'address': address}, (results, status) => {
      console.log('Results: ' + results[0]);
      if (status === 'OK') {
        console.log('status OK. results: ' + results[0].formatted_address);
        console.log('results[0].geometry.location: ' + results[0].geometry.location);
        this.changeMapCenter(results[0].geometry);
      } else {
        console.log('Geocode was not successful.');
        console.log('Status: ' + status);
      }
    }); 
  }

  // handle clicking the "submit" button
  handleSubmit() {
    this.geocodeAddress(this.state.text);
  }

  handleKeyPress(e) {
    if (e.key === 'Enter' && this.state.text !== '') {
      this.handleSubmit();
    }
  }


  render() {
    return(
      <div id="floating-panel">
        <input id="address" type="textbox" placeholder="Enter location" value={this.state.text} onChange={this.handleChange} onKeyPress={this.handleKeyPress}/>
        <input id="submit" type="button" value="Search" onClick={this.handleSubmit}/>
      </div>
    );
  }
}

class AddPinButton extends Component {

  constructor(props) {
    super(props);

    this.state = {
      text: 'Click to add',
    };
  }

  render() {

    const button = (
      this.props.isAddingPin ? 
      <input id="add-pin-button" type="button" value="Click on map to add pin..." disabled /> : 
      <input id="add-pin-button" type="button" value="Add a Pin" onClick={this.props.handleAddPinButton} />
    );
    return(
      <div id="add-pin-button-container">
        {button}
      </div>
    );
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
          <AddPinButton handleAddPinButton={this.props.handleAddPinButton} isAddingPin={this.props.isAddingPin}/>
          <SearchBar changeMapCenter={this.props.changeMapCenter} />
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
      <iframe src="https://open.spotify.com/embed/track/07gqJjvwwuZ1assFLKbiNn" width="250" height="80" frameBorder="0" allowtransparency="true" allow="encrypted-media" title="Spotify Player"></iframe>
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
        <span class='CloseWindow'
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
        <div className="PinDetail">
          Album: <b>{this.state.album}</b>
        </div>
        <div className="PinDetail">
          Year: <b>{this.state.year}</b>
        </div>
        <div className="PinDetail">
          Genre: <b>{this.state.genre}</b>
        </div>
        <div className="PinDetail">
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

  componentDidMount() {
    var mapwidth = this.divElement.clientWidth;
    var mapheight = this.divElement.clientHeight;
    this.props.setMapDimensions(mapwidth, mapheight);
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

    const infoWindow = (
      <InfoWindow clickedPin={this.state.clickedPin} 
                  onCloseInfoWindowClick={this.handleCloseInfoWindowClick}/>
    );

    return (
      <div id="MapBoxWithInfoWindow"
           ref={ (divElement) => {this.divElement = divElement}}
      >
        {this.state.showInfoWindow ? infoWindow : null}
        <SimpleMap onPinClick={this.handlePinClick} 
                   center={this.props.center}
                   zoom={this.props.zoom}
                   setMapDimensions={this.setMapDimensions}
                   isAddingPin={this.props.isAddingPin}
                   handleAddPin={(lat, lng) => this.props.handleAddPin(lat, lng)}/>
      </div>
    );
  }
}

class SuggestionSearch extends Component {


  constructor() {
    super();

    this.handleLyricChange = this.handleLyricChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);


    this.state = {
      value: '',
      suggestions: [],
      isLoading: false,
      trackSelected: false,
      selection: null,
      lyric: "",
    };

    this.latestRequest = null;
    this.debouncedLoadSuggestions = debounce(this.loadSuggestions, 400); // wait 400ms before loading suggestions
  }

  // Populate the input value based on the selected suggestion
  getSuggestionValue = (suggestion) => (
    suggestion.SpotifyTitle
  );

  // Control how a suggestion is rendered
  renderSuggestion = (suggestion) => (
    <div className="Suggestion">
      <div>
        <img src={suggestion.SmallImageURL}/>
      </div>
      <div>
        {suggestion.SpotifyTitle}
      </div>
      <div>
        {suggestion.SpotifyArtist}
      </div>
    </div>
  );

  loadSuggestions(value) {
    // Cancel the previous request
    if (this.lastRequestId !== null) {
      clearTimeout(this.lastRequestId);
    }
    
    this.setState({
      isLoading: true
    });
    
    // Make request
    var url = 'http://' + process.env.REACT_APP_LYRICMAP_API_HOST + '/suggest-tracks';
    const thisRequest = this.latestRequest = fetch(url + '?q=' + String(value), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      })
      .then(res => res.json() )
      .then(res => { 

        console.log('res = ' + res)

        // If this is true there's a newer request happening, stop everything
        if(thisRequest !== this.latestRequest) {
          console.log('newer request, stop')
          return;
        }

        // If this is executed then it's the latest request
        this.setState({
          suggestions: res === null ? [] : res, // if the return value was null, then there are no suggestions
          isLoading: false
        });
      });
  };
    

  onChange = (event, { newValue }) => {
    this.setState({
      value: newValue
    });
  };

  // Autosuggest will call this function every time you need to update suggestions.
  // (Actual state is updated in loadSuggestions)
  onSuggestionsFetchRequested = ({ value }) => {
    this.debouncedLoadSuggestions(value);
  };

  // Autosuggest will call this function every time you need to clear suggestions.
  onSuggestionsClearRequested = () => {
    this.setState({
      suggestions: []
    });
  };

  onSuggestionSelected = (event, {suggestion} ) => {
    console.log('suggestion selected: ' + suggestion);
    this.setState({
      selection: suggestion,
    });
  };

  // Determine whether or not to render suggestions based on the current input
  // Suggestions are rendered if function returns true
  // Currently set to render suggestions if input is longer than 2 characters
  shouldRenderSuggestions = (value) => {
    return value.trim().length > 2;
  };

  handleLyricChange(event) {
    this.setState({
      lyric: event.target.value
    });
  }

  handleSubmit() {
    // validate the text, do nothing if lyric is blank
    if (this.state.lyric === "") {
      alert("Lyric cannot be left empty.")
      return;
    }

    // Post pin
    postPin(this.props.lat, this.props.lng, this.state.selection.SpotifyTitle, this.state.selection.SpotifyArtist, this.state.lyric, this.state.selection.SpotifyID)

    // set adding pin and show addpinwindow to false
    this.props.onCloseAddPinWindowClick();

  }

  render() {
    const { value, suggestions } = this.state;

    // Autosuggest will pass through all these props to the input.
    const inputProps = {
      placeholder: 'Type the name of a song',
      value,
      onChange: this.onChange
    };

    const showManualAddPinButton = (
      <div onClick={this.props.onShowManualAddPinClick}>
        Can't find the song you're looking for on spotify? Click here to add it manually
      </div>
    );

    const addPinLyricBox = (
      <div id="addPinLyric">
        {"Lyric: "}
        <input id="addPinLyric" type="textbox" onChange={this.handleLyricChange}/>
        <input id="addPinSubmit" type="button" value="Submit Pin" onClick={this.handleSubmit}/>
      </div>
    );

    // Finally, render it!
    return (
      <div id="SuggestionSearch">
        <Autosuggest
          suggestions={suggestions}
          onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
          onSuggestionsClearRequested={this.onSuggestionsClearRequested}
          onSuggestionSelected={this.onSuggestionSelected}
          shouldRenderSuggestions={this.shouldRenderSuggestions}
          getSuggestionValue={this.getSuggestionValue}
          renderSuggestion={this.renderSuggestion}
          inputProps={inputProps}
        />
        {this.state.selection == null ? showManualAddPinButton : addPinLyricBox}
      </div>
    );
  }
} // end SuggestionSearch component

// Component to add pin when song is not found in spotify search
class ManualAddPin extends Component {

  constructor(props) {
    super(props);
    this.handleTitleChange = this.handleTitleChange.bind(this);
    this.handleArtistChange = this.handleArtistChange.bind(this);
    this.handleLyricChange = this.handleLyricChange.bind(this);
    this.validateSubmission = this.validateSubmission.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);

    this.state = {
      title: "",
      artist: "",
      lyric: ""
    };
  }

  handleTitleChange(event) {
    this.setState({
      title: event.target.value
    });
  }

  handleArtistChange(event) {
    this.setState({
      artist: event.target.value
    });
  }

  handleLyricChange(event) {
    this.setState({
      lyric: event.target.value
    });
  }

  validateSubmission() {
    if (this.state.title === "") {
      alert("Song Name cannot be blank.");
      return(false);
    }
    if (this.state.artist === "") {
      alert("Artist cannot be blank.");
      return(false);
    }
    if (this.state.lyric === "") {
      alert("Lyric cannot be blank.");
      return(false);
    }
    return(true);
  }

  handleSubmit() {
    // validate the text, do nothing if submission not valid
    if (!this.validateSubmission()) {
      return;
    }

    // Post pin
    postPin(this.props.lat, this.props.lng, this.state.title, this.state.artist, this.state.lyric)

    // set adding pin and show addpinwindow to false
    this.props.onCloseAddPinWindowClick();

  }

  render() {
    return(
      <div id="ManualAddPin">
        <div onClick={this.props.onShowSuggestionSearchClick}>
          Want to search for the song on Spotify instead? Click here
        </div>
        <div id="addPinTitleBox">
          {"Song Title: "}
          <input id="addPinTitle" type="textbox" onChange={this.handleTitleChange}/>
        </div>
        <div id="addPinArtistBox">
          {"Artist: "}
          <input id="addPinArtist" type="textbox" onChange={this.handleArtistChange}/>
        </div>
        <div id="addPinLyric">
          {"Lyric: "}
          <input id="addPinLyric" type="textbox" onChange={this.handleLyricChange}/>
        </div>
        <input id="addPinSubmit" type="button" value="Submit Pin" onClick={this.handleSubmit}/>
      </div>
    );
  }

}

class AddPinWindow extends Component {

  constructor(props) {
    super(props);
    this.onShowSuggestionSearchClick = this.onShowSuggestionSearchClick.bind(this);
    this.onShowManualAddPinClick = this.onShowManualAddPinClick.bind(this);

    this.state = {
      showManualAddPin: false,
    };
  }

  onShowSuggestionSearchClick() {
    this.setState({
      showManualAddPin: false,
    });
  }

  onShowManualAddPinClick() {
    this.setState({
      showManualAddPin: true,
    });
  }

  render() {

    return(
      <div id="AddPinWindow">
        <span className='CloseWindow'
              onClick={this.props.onCloseAddPinWindowClick}>X</span>
        {this.state.showManualAddPin ?
          <ManualAddPin onCloseAddPinWindowClick={this.props.onCloseAddPinWindowClick}
                        onShowSuggestionSearchClick={this.onShowSuggestionSearchClick}
                        lat={this.props.lat}
                        lng={this.props.lng}
          /> : 
          <SuggestionSearch onCloseAddPinWindowClick={this.props.onCloseAddPinWindowClick}
                            onShowManualAddPinClick={this.onShowManualAddPinClick}
                            lat={this.props.lat}
                            lng={this.props.lng}
          />
        }
      </div>
    );
  }

}

// the header + MapBox
class MapPage extends Component {

  constructor(props) {
    super(props);
    this.handleAddPinButton = this.handleAddPinButton.bind(this);
    this.handleAddPin = this.handleAddPin.bind(this);
    this.handleCloseAddPinWindowClick = this.handleCloseAddPinWindowClick.bind(this);

    this.state = {
      center: null,
      mapwidth: null,
      mapheight: null,
      isAddingPin: false,
      showAddPinWindow: false,
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
    console.log('setting isAddingPin to true')
    this.setState({
      isAddingPin: true,
    });
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

  render() {

    const addPinWindow = (
      <AddPinWindow onCloseAddPinWindowClick={this.handleCloseAddPinWindowClick} lat={this.state.addingPinLat} lng={this.state.addingPinLng}/>
    );

    return(
      <div>
        <Header changeMapCenter={(g) => this.changeMapCenter(g)} handleAddPinButton={this.handleAddPinButton} isAddingPin={this.state.isAddingPin}/>
        <MapBox center={this.state.center} 
                zoom={this.state.zoom}
                setMapDimensions={(mapwidth, mapheight) => this.setMapDimensions(mapwidth, mapheight)}
                isAddingPin={this.state.isAddingPin}
                handleAddPin={(lat, lng) => this.handleAddPin(lat, lng)}/>
        {this.state.showAddPinWindow ? addPinWindow : null}
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
