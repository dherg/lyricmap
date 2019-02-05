import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

// my imports
import GoogleMapReact from 'google-map-react';
import { fitBounds } from 'google-map-react/utils';
import { BrowserRouter as Router, Route, Link, NavLink, Switch } from 'react-router-dom';
import PropTypes from 'prop-types';
import Autosuggest from 'react-autosuggest';
import debounce from 'lodash/debounce';

// my components
import About from './About';
import AddPinButton from './AddPinButton';
import GoogleSignIn from './GoogleSignIn';
import InfoWindow from './InfoWindow';
import ManualAddPin from './ManualAddPin';
import NamePrompt from './NamePrompt';
import NotFound from './NotFound';
import SearchBar from './SearchBar';
import SimpleMap from './SimpleMap';
import UpdateDisplayNameBox from './UpdateDisplayNameBox';

const google = window.google;

// keep track of signed in user
var globalCurrentUser = {
                    "userID": null,
                    "displayName": null
                  };

// POST a pin with optional metadata
// lat, lng, title, artist, and lyric are mandatory for all pins
// spotifyID, album, year, genre, are optional
export function postPin(lat, lng, title, artist, lyric, spotifyID=null, album=null, year=null, genre=null) {

  // check if mandatory parameters are 
  if (lat === null || lng === null || title === null || artist === null || lyric === null) {
    throw new Error('One or more of lat, lng, title, artist, or lyric were null. Not posting pin.');
  }
  
  // get url for environment 
  var url = 'http://' + process.env.REACT_APP_LYRICMAP_API_HOST + '/pins';

  fetch(url, {
    method: 'POST',
    credentials: 'include',
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

// PUT request to update display name
export function putDisplayName(newName) {
  // get url for environment 
  var url = 'http://' + process.env.REACT_APP_LYRICMAP_API_HOST + '/users';

  fetch(url, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      newName: newName,
    })
  })
  .then(res => res.json())
  .then(res => {
    if (res.status === 200 && res["DisplayName"] !== "") {
      globalCurrentUser.displayName = res["DisplayName"]
    }
  })
  .catch(error => console.error('Error changing name:', error));
}

class UserPage extends Component {

  constructor(props) {
    super(props);
    this.handleUpdateDisplayName = this.handleUpdateDisplayName.bind(this);

    var userID = this.props.match.params.id;
    console.log(userID)
    if (typeof userID !== "undefined" && userID !== "") {
      console.log('got real userID. fetching display name')
      this.fetchUserDetails(userID)
    }

    this.state = {
      'isLoading': true,
      'displayName': "", // Only a valid display name when isLoading = false
      'userFound': false,
    };
  }

  // get the user details via GET to /users endpoint, update the state with
  // the display name, and change isLoading to false
  fetchUserDetails(userID) {
    // get url for environment 
    var url = 'http://' + process.env.REACT_APP_LYRICMAP_API_HOST + '/users';
    var that = this;
    fetch(url + '?id=' + String(userID), {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      })
      .then(res => {
        if (res.status === 404) {
          this.setState({
            'isLoading': false,
          })
        } else if (res.status !== 200) {
          throw new Error("Not 200 response");
        } else {
          res.json().then(function(data) {
              if (data["DisplayName"] !== "") {
                that.setState({
                  "isLoading": false, 
                  "displayName": data["DisplayName"],
                  "userFound": true,
                })
              }
          })
        }
      })
      .catch(function(err) {
        console.log(err)
      }); // end fetch()
  }

  // PUT new display name for the currently logged in user
  handleUpdateDisplayName(newName) {
    putDisplayName(newName);
  }


  render() {
    const name = (this.state.userFound ? this.state.displayName : "User not found!");
    const display = (this.state.isLoading ? "Loading..." : name);

    // only show box to change display name if on the currently logged in user's page
    const updateDisplayNameBox = (this.props.match.params.id === globalCurrentUser.userID ? 
                                  <UpdateDisplayNameBox updateDisplayName={this.handleUpdateDisplayName}/> :
                                  null);

    return (
      <div>
        <Header />
        <div className="UserPage">
          {display}
        </div>
        {updateDisplayNameBox}
      </div>
    );
  }
}

// Site header bar
class Header extends Component {

  constructor(props) {
    super(props);
    this.updateCurrentUser = this.updateCurrentUser.bind(this);
    this.handlePromptForName = this.handlePromptForName.bind(this);

    this.state = {
      displayName: ""
    }
  }

  updateCurrentUser(newUserID, newName) {
    globalCurrentUser.userID = newUserID;
    globalCurrentUser.displayName = newName;
    this.setState({"displayName": ""}); // set state to same thing - force rerender of displayname after it is updated in signin
  }

  handlePromptForName(userID) {
    this.props.handlePromptForName(userID)
  }

  render() {

    // get currently logged in user info
    const userNav = (globalCurrentUser.displayName == null ? "" : globalCurrentUser.displayName);
    var userLink = (globalCurrentUser.userID == null ? "user" : globalCurrentUser.userID);

    // conditionally render header links based on whether on map page or not
    // true if on map page, false or undefined if not
    let headerBox;
    if (this.props.onMapPage) {
      headerBox = (
        <div className="Header-link-box">
          <div className="Header-link">
            <GoogleSignIn handleUpdateCurrentUser={this.updateCurrentUser} handlePromptForName={this.handlePromptForName}/>
          </div>
          <div className="Header-link">
            <NavLink to={"users/" + globalCurrentUser.userID}>
               {userNav}
            </NavLink> 
          </div>
          <div className="Header-link">
            <NavLink to="random">Random</NavLink> 
          </div>
          <div className="Header-link">
            <NavLink to="about">About</NavLink> 
          </div>
          <AddPinButton handleAddPinButton={this.props.handleAddPinButton} isAddingPin={this.props.isAddingPin}/>
          <SearchBar changeMapCenter={this.props.changeMapCenter} />
        </div>
      ); // end headerBox assignment
    } else {
      headerBox = (
        <div className="Header-link-box">
          <div className="Header-link">
            <GoogleSignIn handleUpdateCurrentUser={this.updateCurrentUser}/>
          </div>
          <div className="Header-link">
            <NavLink to={userLink}>
               {userNav}
            </NavLink> 
          </div>
          <div className="Header-link">
            <NavLink to="about">About</NavLink> 
          </div>
        </div>
      ); // end headerBox assignment
    }

    return (
      <div className="App-header">
        <div className="Logo-box">
          <Link to="" className="Logo-box">
            <div>
              <img src={logo} className="App-logo" alt="logo" />
            </div>
            <div>
              <h1 className="App-title">Lyric Map</h1>
            </div>
          </Link>
        </div>
        {headerBox}
      </div>
    ); // close return
  } // close render()
}

// Everything under the header bar (map + pin info panels)
class MapBox extends Component {

  constructor(props) {
    super(props);

    this.handlePinClick = this.handlePinClick.bind(this);
    this.handleCloseInfoWindowClick = this.handleCloseInfoWindowClick.bind(this);

    this.state = {
      showInfoWindow: false,
      clickedPinID: null,
    };
  }

  componentDidMount() {
    var mapwidth = this.divElement.clientWidth;
    var mapheight = this.divElement.clientHeight;
    this.props.setMapDimensions(mapwidth, mapheight);
  }

  handlePinClick(clickedPinID) {
    this.setState({
      showInfoWindow: true,
      clickedPinID: clickedPinID,
    });
  }

  handleCloseInfoWindowClick() {
    this.setState({
      showInfoWindow: false,
      clickedPinID: null,
    });
  }

  componentDidUpdate(prevProps) {
    if (this.props.isAddingPin != prevProps.isAddingPin && this.props.isAddingPin == true) {
      this.setState({
        showInfoWindow: false,
      });
    }
  }

  render() {

    const infoWindow = (
      <InfoWindow clickedPinID={this.state.clickedPinID} 
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
        <img src={suggestion.SmallImageURL} alt={suggestion.SpotifyTitle + " album cover"}/>
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
        credentials: 'include',
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
      <div id="AddPinLyric">
        {"Lyric (only the relevant lines!) "}
        <form id="AddPinLyricForm"> 
          <textarea id="AddPinLyricTextArea" onChange={this.handleLyricChange}/>
          <input id="AddPinSubmit" type="button" value="Submit Pin" onClick={this.handleSubmit}/>
        </form>
      </div>
    );

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
    if (globalCurrentUser.userID !== null) {
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

class AppRouter extends Component {

  constructor(props) {
    super(props);

    this.state = {
      loggedInUser: null
    }
  }

  render() {
    return (
      <Router>
        <div>
            <Switch>
              <Route path="/about" component={About} />
              <Route path="/users/:id" component={UserPage} />
              <Route path="/users" component={UserPage} />
              <Route exact path="/" component={MapPage} />
              <Route component={NotFound} />
            </Switch>
        </div>
      </Router>
    );
  }
}

export default AppRouter;
