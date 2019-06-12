import React, { Component } from 'react';

import InfoWindow from './InfoWindow';
import SimpleMap from './SimpleMap';

// Everything under the header bar (map + pin info panels)
export default class MapBox extends Component {
  constructor(props) {
    super(props);

    this.handlePinClick = this.handlePinClick.bind(this);
    this.handleCloseInfoWindowClick = this.handleCloseInfoWindowClick.bind(this);

    this.state = {
      clickedPinID: null,
    };
  }

  componentDidMount() {
    const mapwidth = this.divElement.clientWidth;
    const mapheight = this.divElement.clientHeight;
    this.props.setMapDimensions(mapwidth, mapheight);
  }

  handlePinClick(clickedPinID) {
    this.setState({
      clickedPinID,
    });
    this.props.showInfoWindow();
  }

  handleCloseInfoWindowClick() {
    this.setState({
      clickedPinID: null,
    });
    this.props.hideInfoWindow();
  }

  componentDidUpdate(prevProps) {
    if (this.props.isAddingPin !== prevProps.isAddingPin && this.props.isAddingPin) {
      this.setState({
        showInfoWindow: false,
      });
    } else if (this.props.linkedPin !== prevProps.linkedPin && this.props.linkedPin === null) {
      this.handleCloseInfoWindowClick();
    }
  }


  render() {
    const infoWindow = (
      <InfoWindow
        clickedPinID={this.state.clickedPinID}
        onCloseInfoWindowClick={this.handleCloseInfoWindowClick}
      />
    );

    return (
      <div
        id="Map-Box-With-Info-Window"
        ref={(divElement) => { this.divElement = divElement; }}
      >
        {this.props.show ? infoWindow : null}
        <SimpleMap
          onPinClick={this.handlePinClick}
          center={this.props.center}
          zoom={this.props.zoom}
          setMapDimensions={this.setMapDimensions}
          isAddingPin={this.props.isAddingPin}
          handleAddPin={(lat, lng) => this.props.handleAddPin(lat, lng)}
          handlePinListUpdate={pinList => this.props.handlePinListUpdate(pinList)}
          linkedPin={this.props.linkedPin}
          addedPins={this.props.addedPins}
        />
      </div>
    );
  }
}
