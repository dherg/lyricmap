import React, {Component} from 'react';

import { postPin } from './App';

// Component to add pin when song is not found in spotify search
export default class ManualAddPin extends Component {

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
    postPin(this.props.lat, this.props.lng, this.state.title, this.state.artist, this.state.lyric);

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