import React, {Component} from 'react';

import { Link } from 'react-router-dom';

import { fetchPinInfo } from './App';

import Table from 'react-bootstrap/Table';
import Spinner from 'react-bootstrap/Spinner';


// side panel with info about clicked pin
export default class InfoWindow extends Component {

  constructor(props) {
    super(props);

    this.updateWindowDimensions = this.updateWindowDimensions.bind(this);

    this.state = {
      spotifyID: null,
      title: null,
      artist: null,
      album: null,
      releaseDate: null,
      lyrics: null,
      genre: null,
      createdByID: null,
      createdByName: null,
      createdDate: null,
      mediumImageURL: null,
      viewportWidth: null,
      viewportHeight: null,
    };
  }  

  fetchCreatorDisplayName(userID) {
    // get url for environment 
    var url = process.env.REACT_APP_LYRICMAP_API_HOST + '/users';
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
    if (this.props.clickedPinID === null) {
      return
    }
    fetchPinInfo(this.props.clickedPinID).then(res => this.setState(res));
    this.updateWindowDimensions();
    window.addEventListener('resize', this.updateWindowDimensions);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateWindowDimensions);
  }

  updateWindowDimensions() {
    this.setState({ viewportWidth: window.innerWidth, viewportHeight: window.innerHeight });
  }

  componentDidUpdate(prevProps, prevState) {
    // update all the props if pinID has changed
    if (this.props.clickedPinID !== prevProps.clickedPinID) {
      fetchPinInfo(this.props.clickedPinID).then(res => this.setState(res));
    } else if (this.state.createdByID !== prevState.createdByID && this.state.createdByID !== null) {
      // if we've now fetched pin info, try to fetch display name of user who added pin
      this.fetchCreatorDisplayName(this.state.createdByID);
    }

  }

  render() {

    var genres = this.state.genre ? this.state.genre.join(", ") : null

    const userLink = "/users/" + String(this.state.createdByID);

    const spotifyEmbed = (
      <iframe src={"https://open.spotify.com/embed/track/" + String(this.state.spotifyID)} id="Spotify-Embed" height="80" frameBorder="0" allowtransparency="true" allow="encrypted-media" title="Spotify Player"></iframe>
    );

    const loadingPinSpinner = (
      <div>
       <div id="Close-Info-Window-Button">
          <button type="button" className="close" onClick={this.props.onCloseInfoWindowClick}>
            <span aria-hidden="true" id="Close-Info-Window-Button">x</span>
            <span className="sr-only">Close Info Window</span>
          </button>
        </div>
        <Spinner as="span"
                 animation="border"
                 role="status"
                 aria-hidden="true"/>
      </div>

    );

    const albumArtAndLyricContainerMobile = (
      <div id="Album-Art-And-Lyric-Container">
        <img id="Album-Art" src={this.state.mediumImageURL} alt={"Album Cover for the album " + this.state.album}/>
        <div id="Info-Window-Lyrics"> 
          {this.state.lyrics}
        </div>
      </div>
    );

    const albumArtAndLyricContainerNormal = (
      <div id="Album-Art-And-Lyric-Container">
        <img id="Album-Art" src={this.state.mediumImageURL} alt={"Album Cover for the album " + this.state.album}/>
        <div id="Info-Window-Lyrics"> 
          {this.state.lyrics}
        </div>
      </div>
    );

    const infoWindowContent = (
      <div id="Info-Window-Content">
        <div id="Info-Window-Header">
          <div id="Info-Window-Title-Text">
            <h4><b>{this.state.title}</b> by <b>{this.state.artist}</b></h4>
          </div>
          <div id="Close-Info-Window-Button">
            <button type="button" className="close" onClick={this.props.onCloseInfoWindowClick}>
              <span aria-hidden="true" id="Close-Info-Window-Button">x</span>
              <span className="sr-only">Close Info Window</span>
            </button>
          </div>
        </div>
        <div id="Info-Window-Data-Container">
          {this.state.viewportWidth > 769 ? albumArtAndLyricContainerNormal : albumArtAndLyricContainerMobile}
          <div id="Song-Info-Container"> 
            <Table id="Song-Info" variant="dark" size="sm">
              <tbody>
                <tr>
                  <td>Album</td>
                  <td><b>{this.state.album}</b></td>
                </tr>
                <tr>
                  <td>Release Date</td>
                  <td><b>{this.state.releaseDate}</b></td>
                </tr>
                <tr>
                  <td>Genres</td>
                  <td><b>{genres}</b></td>
                </tr>
                <tr>
                  <td>Added On</td>
                  <td><b>{this.state.createdDate}</b></td>
                </tr>
                <tr>
                  <td>Added By</td>
                  <td><b><Link id="Info-Window-User-Link" to={userLink}> {this.state.createdByName === null ? this.state.createdByID : this.state.createdByName} </Link></b></td>
                </tr>
              </tbody>
            </Table>
          </div>
        </div>
        {spotifyEmbed}
      </div>
    );

    return (
        <div id="Info-Window">
          {this.state.lyrics === null ? loadingPinSpinner : infoWindowContent}
        </div>
    );
  }
}