import React, {Component} from 'react';

import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import FormControl from 'react-bootstrap/FormControl'

const google = window.google;

// Search bar
export default class SearchBar extends Component {

  constructor(props) {
    super(props);

    this.changeMapCenter = this.changeMapCenter.bind(this);
    this.geocodeAddress = this.geocodeAddress.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  // take in geometry object and update the map center with .location and .viewport
  changeMapCenter(geometry) {
    this.props.changeMapCenter(geometry);
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
  handleSubmit(event) {
    event.preventDefault();
    event.stopPropagation();
    const form = event.currentTarget;
    this.geocodeAddress(form.elements.address.value);
    this.props.closeNavIfExpanded();
  }

  render() {

    return(
      <Form inline id="Search-Bar" onSubmit={e => this.handleSubmit(e)}>
        <FormControl name="address" type="text" placeholder="Search for a location" className="mr-sm-2" />
        <Button variant="outline-success" type="submit">Search</Button>
      </Form>
    );
  }
}