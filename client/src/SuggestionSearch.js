import React, { Component } from 'react';

import Autosuggest from 'react-autosuggest';
import debounce from 'lodash/debounce';

import Form from 'react-bootstrap/Form';
import { postPin } from './App';
import LoadingButton from './LoadingButton';


export default class SuggestionSearch extends Component {
  constructor() {
    super();

    this.onChange = this.onChange.bind(this);
    this.onSuggestionsFetchRequested = this.onSuggestionsFetchRequested.bind(this);
    this.onSuggestionsClearRequested = this.onSuggestionsClearRequested.bind(this);
    this.onSuggestionSelected = this.onSuggestionSelected.bind(this);

    this.state = {
      value: '',
      suggestions: [],
      isLoading: false,
      isLoadingSubmissionResponse: false,
      selection: null,
      validated: false,
    };

    this.latestRequest = null;

    // Wait 400ms before loading suggestions
    this.debouncedLoadSuggestions = debounce(this.loadSuggestions, 400);
  }

  // Function to pass as inputProp to AutoSuggest input element
  onChange(event, { newValue }) {
    this.setState({
      value: newValue,
    });
  }

  // Autosuggest will call this function every time you need to update suggestions.
  // (Actual state is updated in loadSuggestions)
  onSuggestionsFetchRequested({ value }) {
    this.debouncedLoadSuggestions(value);
  }

  // Autosuggest will call this function every time you need to clear suggestions.
  onSuggestionsClearRequested() {
    this.setState({
      suggestions: [],
    });
  }

  onSuggestionSelected(event, { suggestion }) {
    this.setState({
      selection: suggestion,
    });

    // Set custom form validity for input based on selection being made
    const suggestionInputField = document.getElementById('autosuggest-input');
    suggestionInputField.setCustomValidity('');
  }

  getSuggestionValue(suggestion) {
    return (`${suggestion.SpotifyTitle} by ${suggestion.SpotifyArtist}`);
  }

  loadSuggestions(value) {
    // Cancel the previous request if present
    if (this.lastRequestId !== null) {
      clearTimeout(this.lastRequestId);
    }

    this.setState({
      isLoading: true,
    });

    // Make request to suggestions endpoint
    const url = `${process.env.REACT_APP_LYRICMAP_API_HOST}/suggest-tracks`;
    const thisRequest = this.latestRequest = fetch(`${url}?q=${String(value)}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })
      .then(res => res.json())
      .then((res) => {
        // If newer request is happening, stop here
        if (thisRequest !== this.latestRequest) {
          return;
        }

        this.setState({
          suggestions: res === null ? [] : res,
          isLoading: false,
        });
      });
  }

  // Determine whether or not to render suggestions based on the current form input
  // Suggestions are rendered if this function returns true
  shouldRenderSuggestions(value) {
    return value.trim().length > 2;
  }

  handleSubmit(event) {
    const form = event.currentTarget;
    event.preventDefault();
    event.stopPropagation();
    this.setState({ validated: true });
    if (form.checkValidity() === true && this.state.selection !== null) {
      this.setState({ isLoadingSubmissionResponse: true });
      postPin(this.props.lat, this.props.lng, this.state.selection.SpotifyTitle,
        this.state.selection.SpotifyArtist, form.elements.lyric.value, this.state.selection.SpotifyID)
        .then((data) => {
          this.props.onPinSubmittedResponse(data);
        });
    } else if (this.state.selection === null) {
      // User tried to submit but no song selected, so set suggestion input field to invalid.
      const suggestionInputField = document.getElementById('autosuggest-input');
      suggestionInputField.setCustomValidity('invalid');
    }
  }

  renderSuggestion(suggestion) {
    return (
      <div className="Suggestion">
        <div>
          <img src={suggestion.SmallImageURL} alt={`${suggestion.SpotifyTitle} album cover`} />
        </div>
        <div id="Suggestion-Search-Suggestion-Title">
          {suggestion.SpotifyTitle}
        </div>
        <div>
          {suggestion.SpotifyArtist}
        </div>
      </div>
    );
  }

  render() {
    const { value, suggestions } = this.state;

    // Props to pass through to AutoSuggest input element
    const inputProps = {
      placeholder: 'Search for a song on Spotify',
      value,
      onChange: this.onChange,
      className: 'form-control',
    };

    // Customize suggestion input rendering to apply custom validation stylings
    const renderInputComponent = props => (
      <div>
        <input required id="autosuggest-input" {...props} />
        <div className="invalid-feedback">
          Track selection is required.
        </div>
      </div>
    );

    return (
      <Form
        noValidate
        validated={this.state.validated}
        onSubmit={e => this.handleSubmit(e)}
      >
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
          <Form.Control required name="lyric" as="textarea" rows="2" placeholder="Enter the location-relevant portion of the lyrics" />
          <Form.Control.Feedback type="invalid">
              The location lyric is required.
          </Form.Control.Feedback>
        </Form.Group>
        <LoadingButton isLoading={this.state.isLoadingSubmissionResponse} variant="primary" />
      </Form>
    );
  }
}
