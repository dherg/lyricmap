import React, {Component} from 'react';

import { Link } from 'react-router-dom';

import { fetchPinInfo } from './App';

import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import Spinner from 'react-bootstrap/Spinner';


// side panel with info about clicked pin
export default class InfoWindow extends Component {

  constructor(props) {
    super(props);

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
      mediumImageURL: null
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
    fetchPinInfo(this.props.clickedPinID).then(res => this.setState(res));
  }

  componentDidUpdate(prevProps, prevState) {
    // update all the props if pinID has changed
    if (this.props.clickedPinID !== prevProps.clickedPinID) {
      fetchPinInfo(this.props.clickedPinID).then(res => this.setState(res));
    } else if (this.state.createdByID !== prevState.createdByID && this.state.createdByID !== null) {
      // if we've now fetched pin info, try to fetch display name
      console.log('fetching display name')
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
          <button type="button" class="close" onClick={this.props.onCloseInfoWindowClick}>
            <span aria-hidden="true" id="Close-Info-Window-Button">x</span>
            <span class="sr-only">Close Info Window</span>
          </button>
        </div>
        <Spinner as="span"
                 animation="border"
                 role="status"
                 aria-hidden="true"/>
      </div>

    );

    const infoWindowContent = (
      <div id="Info-Window-Content">
        <div id="Info-Window-Header">
          <div id="Close-Info-Window-Button">
            <button type="button" class="close" onClick={this.props.onCloseInfoWindowClick}>
              <span aria-hidden="true" id="Close-Info-Window-Button">x</span>
              <span class="sr-only">Close Info Window</span>
            </button>
          </div>
          <h4><b>{this.state.title}</b> by <b>{this.state.artist}</b></h4>
        </div>
        <div id="Album-Art-And-Lyric-Container">
            <img id="Album-Art" src={this.state.mediumImageURL} />
            <div id="Info-Window-Lyrics"> 
              {this.state.lyrics}
            </div>
        </div>
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
                <td><b><Link id="InfoWindowUserLink" to={userLink}> {this.state.createdByName === null ? this.state.createdByID : this.state.createdByName} </Link></b></td>
              </tr>
            </tbody>
          </Table>
        </div>
        {spotifyEmbed}
      </div>
    );

    return (
        <div id="InfoWindow">
          {this.state.lyrics === null ? loadingPinSpinner : infoWindowContent}
        </div>
    );

    // return (
    //   <div id='InfoWindow'>
    //     <span className='CloseWindow'
    //       onClick={() => this.props.onCloseInfoWindowClick()}>X</span>
    //     <Card className="bg-dark" style={{ width: '18rem' }}>
    //       <Card.Title>{this.state.title}</Card.Title>
    //       <Card.Text>
    //         {this.state.lyrics}
    //       </Card.Text>
    //       <Card.Text>
    //         By {this.state.artist} on {this.state.album} ({this.state.releaseDate})
    //         {this.state.spotifyembed}
    //       </Card.Text>
    //     </Card>
    //     <div id='PinLyrics'>
    //       {this.state.lyrics}
    //     </div>
    //     <div id='PinTitle'>
    //       {this.state.title}
    //     </div>
    //     <div id='PinArtist'>
    //       by <b>{this.state.artist}</b>
    //     </div>
    //     <div className="PinDetail">
    //       Album: <b>{this.state.album}</b>
    //     </div>
    //     <div className="PinDetail">
    //       Release Date: <b>{this.state.releaseDate}</b>
    //     </div>
    //     <div className="PinDetail">
    //       Genres: <b>{genres}</b>
    //     </div>
    //     <div className="PinDetail">
    //       PinID: {this.props.clickedPinID}
    //     </div>
    //     <div className="PinDetail">
    //       Added By: <Link id="InfoWindowUserLink" to={userLink}> {this.state.createdByName === null ? this.state.createdByID : this.state.createdByName} </Link>
    //     </div>
    //     <div className="PinDetail">
    //       Added on: {this.state.createdDate}
    //     </div> 
    //     <div id='SpotifyEmbed'>
    //       {this.state.spotifyembed}
    //     </div>
    //   </div>
    // );
  }
}