import React, {Component} from 'react';

import { Link } from 'react-router-dom';

// side panel with info about clicked pin
export default class InfoWindow extends Component {

  constructor(props) {
    super(props);

    this.state = {
      spotifyembed: null,
      title: null,
      artist: null,
      album: null,
      releaseDate: null,
      lyrics: null,
      genre: null,
      createdByID: null,
      createdByName: null,
      createdDate: null
    };
  }

  // fetch pin info and update state for given pinID
  fetchPinInfo(pinID) {
    console.log('clicked pin id = ' + pinID)
    // Make request
    var url = 'http://' + process.env.REACT_APP_LYRICMAP_API_HOST + '/pins';
    // const that = this;
    fetch(url + '?id=' + String(this.props.clickedPinID), {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      })
      .then(res => res.json() )
      .then(res => { 
        // get data for pin 0 (should only be one pin)
        res = res[0]
        // save info from the request
        var spotifyID = res["SpotifyID"];
        var spotifyembed = (
          <iframe src={"https://open.spotify.com/embed/track/" + String(spotifyID)} width="250" height="80" frameBorder="0" allowtransparency="true" allow="encrypted-media" title="Spotify Player"></iframe>
        );

        this.setState({
          spotifyembed: spotifyID ? spotifyembed : null,
          title: res["Title"],
          artist: res["Artist"],
          album: res["Album"],
          releaseDate: res["ReleaseDate"],
          lyrics: res["Lyric"],
          genre: res["Genres"],
          createdByID: res["CreatedBy"],
          createdDate: res["CreatedDate"]
        })
      });
  }

  fetchCreatorDisplayName(userID) {
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
          console.log("creator userID not found")
        } else if (res.status !== 200) {
          throw new Error("Not 200 response");
        } else {
          res.json().then(function(data) {
              if (data["DisplayName"] !== "") {
                that.setState({
                  "createdByName": data["DisplayName"],
                })
              }
          })
        }
      })
      .catch(function(err) {
        console.log(err)
      }); // end fetch()
  }

  componentDidMount() {
    // fetch pin data
    this.fetchPinInfo(this.props.clickedPinID);
  }

  componentDidUpdate(prevProps, prevState) {
    // update all the props if pinID has changed
    if (this.props.clickedPinID !== prevProps.clickedPinID) {
      this.fetchPinInfo(this.props.clickedPinID);
    } else if (this.state.createdByID !== prevState.createdByID && this.state.createdByID !== null) {
      // if we've now fetched pin info, try to fetch display name
      console.log('fetching display name')
      this.fetchCreatorDisplayName(this.state.createdByID);
    }

  }

  render() {

    var genres = this.state.genre ? this.state.genre.join(", ") : null

    console.log(this.state.genre);

    const userLink = "users/" + String(this.state.createdByID)

    return (
      <div id='InfoWindow'>
        <span className='CloseWindow'
              onClick={() => this.props.onCloseInfoWindowClick()}>X</span>
        <div id='PinLyrics'>
          {this.state.lyrics}
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
          Release Date: <b>{this.state.releaseDate}</b>
        </div>
        <div className="PinDetail">
          Genres: <b>{genres}</b>
        </div>
        <div className="PinDetail">
          PinID: {this.props.clickedPinID}
        </div>
        <div className="PinDetail">
          Added By: <Link id="InfoWindowUserLink" to={userLink}> {this.state.createdByName === null ? this.state.createdByID : this.state.createdByName} </Link>
        </div>
        <div className="PinDetail">
          Added on: {this.state.createdDate}
        </div> 
      </div>
    );
  }
}