import React, {Component} from 'react';

import Autosuggest from 'react-autosuggest';
import debounce from 'lodash/debounce';

import { postPin } from './App';

import Button from 'react-bootstrap/Button'

export default class SuggestionSearch extends Component {

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
    var url = process.env.REACT_APP_LYRICMAP_API_HOST + '/suggest-tracks';
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
    this.props.onCloseAddPinModalClick();

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
          <Button variant="primary" type="submit" onClick={this.handleSubmit}>
            Submit Pin
          </Button>
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