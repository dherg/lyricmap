import React, {Component} from 'react';

export default class AddPinButton extends Component {

  constructor(props) {
    super(props);

    this.state = {
      text: 'Click to add',
    };
  }

  render() {

    const button = (
      this.props.isAddingPin ? 
      <input id="add-pin-button" type="button" value="Click on map to add Pin, or click here to cancel " onClick={this.props.handleAddPinButton} /> : 
      <input id="add-pin-button" type="button" value="Add a Pin" onClick={this.props.handleAddPinButton} />
    );
    return(
      <div id="add-pin-button-container">
        {button}
      </div>
    );
  }
}