import React, { Component } from 'react';
import './App.css';

// my imports
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import PropTypes from 'prop-types';

// my components
import About from './About';
import MapPage from './MapPage';
import NotFound from './NotFound';
import UserPage from './UserPage';

// keep track of signed in user
window.globalCurrentUser = {
                    "userID": null,
                    "displayName": null
                  };

// fetch pin info and update state for given pinID
export function fetchPinInfo(pinID) {
  console.log('clicked pin id = ' + pinID)
  // Make request
  var url = process.env.REACT_APP_LYRICMAP_API_HOST + '/pins';
  // const that = this;
  return fetch(url + '?id=' + String(pinID), {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  })
  .then(function(res) {
      if (res.status === 404) {
        return(null)
      } else if (res.status >= 400) {
        throw new Error("Bad response from server.");
      }
      return res.json();
    }
  )
  .then(res => { 
    // return null in case of 404
    if (res == null) {
      return null;
    }
    // get data for pin 0 (should only be one pin)
    res = res[0]
    // save info from the request
    var spotifyID = res["SpotifyID"];
    var spotifyembed = (
      <iframe src={"https://open.spotify.com/embed/track/" + String(spotifyID)} width="250" height="80" frameBorder="0" allowtransparency="true" allow="encrypted-media" title="Spotify Player"></iframe>
    );

    console.log('return: ')
    var ret = {
      pinID: res["PinID"],
      lat: res["Lat"],
      lng: res["Lng"],
      spotifyembed: spotifyID ? spotifyembed : null,
      title: res["Title"],
      artist: res["Artist"],
      album: res["Album"],
      releaseDate: res["ReleaseDate"],
      lyrics: res["Lyric"],
      genre: res["Genres"],
      createdByID: res["CreatedBy"],
      createdDate: res["CreatedDate"]
    };
    console.log(ret)

    return(ret);

  });
}

// GET list of pins with optional filters:
//  - addedBy={userID}
// No filters returns list of all pins
export function getPins(addedBy=null) {

  var resource = '/pins';
  if (addedBy !== null) {
    resource += '?addedBy=' + addedBy;
  }

  var url = process.env.REACT_APP_LYRICMAP_API_HOST + resource;

  var pinData;

  return fetch(url)
    .then(function(response) {
      if (response.status >= 400) {
        throw new Error("Bad response from server");
      }
      return response.json();
    })
    .then(function(data) {
      pinData = data;
      console.log(pinData);
      return data;
    });
}

// POST a pin with optional metadata
// lat, lng, title, artist, and lyric are mandatory for all pins
// spotifyID, album, year, genre, are optional
export function postPin(lat, lng, title, artist, lyric, spotifyID=null, album=null, year=null, genre=null) {

  // check if mandatory parameters are 
  if (lat === null || lng === null || title === null || artist === null || lyric === null) {
    throw new Error('One or more of lat, lng, title, artist, or lyric were null. Not posting pin.');
  }
  
  // get url for environment 
  var url = process.env.REACT_APP_LYRICMAP_API_HOST + '/pins';

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
  var url = process.env.REACT_APP_LYRICMAP_API_HOST + '/users';

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
      window.globalCurrentUser.displayName = res["DisplayName"];
      return(newName);
    }
  })
  .catch(error => console.error('Error changing name:', error));
  window.location.reload();
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
              <Route path="/users/:id" component={MapPage} />
              <Route exact path="/pins/:id" component={MapPage} />
              <Route exact path="/" component={MapPage} />
              <Route component={NotFound} />
            </Switch>
        </div>
      </Router>
    );
  }
}

export default AppRouter;
