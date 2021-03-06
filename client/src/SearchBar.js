import React, { Component } from 'react';

import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import FormControl from 'react-bootstrap/FormControl';

const { google } = window;

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
    const geocoder = new google.maps.Geocoder();

    geocoder.geocode({ address }, (results, status) => {
      if (status === 'OK') {
        this.changeMapCenter(results[0].geometry);
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
    this.props.onSearchSubmitClick();
  }

  render() {
    return (
      <Form inline id="Search-Bar" onSubmit={e => this.handleSubmit(e)}>
        <FormControl name="address" type="text" placeholder="Search for a location" className="mr-sm-2" />
        <Button variant="outline-success" type="submit">Search</Button>
      </Form>
    );
  }
}
