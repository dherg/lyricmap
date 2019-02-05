import React, {Component} from 'react';

const google = window.google;

// Search bar
export default class SearchBar extends Component {

  constructor(props) {
    super(props);

    this.changeMapCenter = this.changeMapCenter.bind(this);
    this.geocodeAddress = this.geocodeAddress.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);

    this.state = {
      text: '',
    }
  }

  // take in geometry object and update the map center with .location and .viewport
  changeMapCenter(geometry) {
    this.props.changeMapCenter(geometry);
  }

  // handle change in text box
  handleChange(event) {
    this.setState({text: event.target.value});
  }

  geocodeAddress(address) {
    var geocoder = new google.maps.Geocoder();

    geocoder.geocode({'address': address}, (results, status) => {
      console.log('Results: ' + results[0]);
      if (status === 'OK') {
        console.log('status OK. results: ' + results[0].formatted_address);
        console.log('results[0].geometry.location: ' + results[0].geometry.location);
        this.changeMapCenter(results[0].geometry);
      } else {
        console.log('Geocode was not successful.');
        console.log('Status: ' + status);
      }
    }); 
  }

  // handle clicking the "submit" button
  handleSubmit() {
    this.geocodeAddress(this.state.text);
  }

  handleKeyPress(e) {
    if (e.key === 'Enter' && this.state.text !== '') {
      this.handleSubmit();
    }
  }

  render() {
    return(
      <div id="floating-panel">
        <input id="address" type="textbox" placeholder="Enter location" value={this.state.text} onChange={this.handleChange} onKeyPress={this.handleKeyPress}/>
        <input className="submit" type="button" value="Search" onClick={this.handleSubmit}/>
      </div>
    );
  }
}