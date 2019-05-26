import React, {Component} from 'react';

import { Link } from 'react-router-dom';

import { fetchPinInfo } from './App';

import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Jumbotron from 'react-bootstrap/Jumbotron';
import Spinner from 'react-bootstrap/Spinner';


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

    const userLink = "/users/" + String(this.state.createdByID)

      // <Spinner
      //             as="span"
      //             animation="border"
      //             size="sm"
      //             role="status"
      //             aria-hidden="true"/>

    const loadingPinSpinner = (
      <Spinner
                  as="span"
                  animation="border"
                  role="status"
                  aria-hidden="true"/>
    );

    const infoWindowContent = (
      <div>
        <div>
          <button type="button" class="close" onClick={this.props.onCloseInfoWindowClick}>
            <span aria-hidden="true" id="Close-Info-Window-Button">x</span>
            <span class="sr-only">Close Info Window</span>
          </button>
        </div>
        <h1>Hello, world!</h1>
        
        <p>
          This is a simple hero unit, a simple jumbotron-style component for calling
          extra attention to featured content or information.
        </p>
        <p>
          <Button variant="primary">Learn more</Button>
        </p>
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