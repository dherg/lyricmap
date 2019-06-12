import React, { Component } from 'react';
import './App.css';

// my imports
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

// my components
import MapPage from './MapPage';
import NotFound from './NotFound';

// keep track of signed in user
window.globalCurrentUser = {
  userID: null,
  displayName: null,
};

// fetch pin info and update state for given pinID
export function fetchPinInfo(pinID) {
  // Make request
  const url = `${process.env.REACT_APP_LYRICMAP_API_HOST}/pins`;
  return fetch(`${url}?id=${String(pinID)}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  })
    .then((res) => {
      if (res.status === 404) {
        return (null);
      } if (res.status >= 400) {
        throw new Error('Bad response from server.');
      }
      return res.json();
    })
    .then((res) => {
      // return null in case of 404
      if (res == null) {
        return null;
      }
      // get data for pin 0 (should only be one pin)
      res = res[0];

      const ret = {
        pinID: res.PinID,
        lat: res.Lat,
        lng: res.Lng,
        spotifyID: res.SpotifyID,
        title: res.Title,
        artist: res.Artist,
        album: res.Album,
        releaseDate: res.ReleaseDate,
        lyrics: res.Lyric,
        genre: res.Genres,
        createdByID: res.CreatedBy,
        createdDate: res.CreatedDate,
        smallImageURL: res.SmallImageURL,
        mediumImageURL: res.MediumImageURL,
      };

      return (ret);
    });
}

// GET list of pins with optional filters:
//  - addedBy={userID}
// No filters returns list of all pins
export function getPins(addedBy = null) {
  let resource = '/pins';
  if (addedBy !== null) {
    resource += `?addedBy=${addedBy}`;
  }

  const url = process.env.REACT_APP_LYRICMAP_API_HOST + resource;

  return fetch(url)
    .then((response) => {
      if (response.status >= 400) {
        throw new Error('Bad response from server');
      }
      return response.json();
    });
}

// POST a pin with optional metadata
// lat, lng, title, artist, and lyric are mandatory for all pins
// spotifyID, album, year, genre, are optional
export function postPin(lat, lng, title, artist, lyric, spotifyID = null, album = null, year = null, genre = null) {
  // check if mandatory parameters are
  if (lat === null || lng === null || title === null || artist === null || lyric === null) {
    throw new Error('One or more of lat, lng, title, artist, or lyric were null. Not posting pin.');
  }

  // get url for environment
  const url = `${process.env.REACT_APP_LYRICMAP_API_HOST}/pins`;

  return fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      lat,
      lng,
      title,
      artist,
      lyric,
      spotifyID: (spotifyID === null ? undefined : spotifyID),
      album: (album === null ? undefined : album),
      year: (year === null ? undefined : year),
      genre: (genre === null ? undefined : genre),
    }),
  }).then((response) => {
    if (response.status >= 400) {
      return (null);
    }
    return response.json();
  });
}

// PUT request to update display name
export function putDisplayName(newName) {
  // get url for environment
  const url = `${process.env.REACT_APP_LYRICMAP_API_HOST}/users`;

  fetch(url, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      newName,
    }),
  })
    .then(res => res.json())
    .then((res) => {
      if (res.status === 200 && res.DisplayName !== '') {
        window.globalCurrentUser.displayName = res.DisplayName;
        return (newName);
      }
    })
    .catch(error => console.error('Error changing name:', error));
  window.location.reload();
}

class AppRouter extends Component {
  constructor(props) {
    super(props);

    this.state = {
      loggedInUser: null,
    };
  }

  render() {
    return (
      <Router>
        <div>
          <Switch>
            <Route path="/about" component={MapPage} />
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
