import React, {Component} from 'react';

import Autosuggest from 'react-autosuggest';
import debounce from 'lodash/debounce';

import { postPin } from './App';

import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'

export default class SuggestionSearch extends Component {

  constructor() {
    super();

    this.state = {
      value: '',
      suggestions: [],
      isLoading: false,
      selection: null,
      validated: false
    };

    this.latestRequest = null;
    this.debouncedLoadSuggestions = debounce(this.loadSuggestions, 400); // wait 400ms before loading suggestions
  }

  // Populate the input value based on the selected suggestion
  getSuggestionValue = (suggestion) => (
    suggestion.SpotifyTitle + " by " + suggestion.SpotifyArtist
  );

  // Control how a suggestion is rendered
  renderSuggestion = (suggestion) => (
    <div className="Suggestion">
      <div>
        <img src={suggestion.SmallImageURL} alt={suggestion.SpotifyTitle + " album cover"}/>
      </div>
      <div>
        <b> {suggestion.SpotifyTitle} </b>
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

        // If this is true there's a newer request happening, stop here
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
    console.log('suggestion selected:');
    console.log(suggestion)
    this.setState({
      selection: suggestion,
    });

    // set custom validity for input  based on selection being made
    var suggestionInputField = document.getElementById("autosuggest-input");
    suggestionInputField.setCustomValidity("");

  };

  // Determine whether or not to render suggestions based on the current input
  // Suggestions are rendered if function returns true
  // Currently set to render suggestions if input is longer than 2 characters
  shouldRenderSuggestions = (value) => {
    return value.trim().length > 2;
  };

  handleSubmit(event) {

    const form = event.currentTarget;
    event.preventDefault();
    event.stopPropagation();
    this.setState({ validated: true });
    if (form.checkValidity() === true && this.state.selection !== null) {
      // console.log(this.props.lat, this.props.lng, form.elements.title.value, form.elements.artist.value, form.elements.lyric.value);
      postPin(this.props.lat, this.props.lng, this.state.selection.SpotifyTitle, this.state.selection.SpotifyArtist, form.elements.lyric.value, this.state.selection.SpotifyID)
      this.props.onCloseAddPinModalClick();
    } else if (this.state.selection === null) {
      // tried to submit but no song selected. set suggestion input field to invalid
      var suggestionInputField = document.getElementById("autosuggest-input");
      suggestionInputField.setCustomValidity("invalid");
    }
  }

  render() {
    const { value, suggestions } = this.state;

    // Props to pass through to AutoSuggest input element
    const inputProps = {
      placeholder: 'Search for a song on Spotify',
      value,
      onChange: this.onChange,
      className: "form-control"
    };

    // customize suggestion input rendering to apply bootstrap validation stylings
    const renderInputComponent = inputProps => (
      <div>
        <input required id="autosuggest-input" {...inputProps}/>
        <div className="invalid-feedback">
          Track selection is required.
        </div>
      </div>
    );

    return (
        <Form noValidate
              validated={this.state.validated}
              onSubmit={e => this.handleSubmit(e)}>
          <Form.Group controlId="formPinSuggestion">
            <Form.Label>Track:</Form.Label>
            <Autosuggest
              suggestions={suggestions}
              onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
              onSuggestionsClearRequested={this.onSuggestionsClearRequested}
              onSuggestionSelected={this.onSuggestionSelected}
              shouldRenderSuggestions={this.shouldRenderSuggestions}
              getSuggestionValue={this.getSuggestionValue}
              renderInputComponent={renderInputComponent}
              renderSuggestion={this.renderSuggestion}
              inputProps={inputProps}

            />
            <Form.Control.Feedback type="invalid">
              Track selection is required.
            </Form.Control.Feedback>
          </Form.Group>
          <Form.Group controlId="formPinLyric">
            <Form.Label>Lyric:</Form.Label>
            <Form.Control required name="lyric" as="textarea" rows="2" placeholder="Enter the location-relevant portion of the lyrics"/>
            <Form.Control.Feedback type="invalid">
              The location lyric is required.
            </Form.Control.Feedback>
          </Form.Group>
          <Button variant="primary" type="submit">
            Submit Pin
          </Button>
        </Form>
    );
  }
} // end SuggestionSearch component