import React, {Component} from 'react';

import ManualAddPin from './ManualAddPin';
import SuggestionSearch from './SuggestionSearch';

export default class AddPinWindow extends Component {

  constructor(props) {
    super(props);
    this.onShowSuggestionSearchClick = this.onShowSuggestionSearchClick.bind(this);
    this.onShowManualAddPinClick = this.onShowManualAddPinClick.bind(this);

    this.state = {
      showManualAddPin: false,
    };
  }

  onShowSuggestionSearchClick() {
    this.setState({
      showManualAddPin: false,
    });
  }

  onShowManualAddPinClick() {
    this.setState({
      showManualAddPin: true,
    });
  }

  render() {

    return(
      <div id="AddPinWindow">
        <span className='CloseWindow'
              onClick={this.props.onCloseAddPinWindowClick}>X</span>
        {this.state.showManualAddPin ?
          <ManualAddPin onCloseAddPinWindowClick={this.props.onCloseAddPinWindowClick}
                        onShowSuggestionSearchClick={this.onShowSuggestionSearchClick}
                        lat={this.props.lat}
                        lng={this.props.lng}
          /> : 
          <SuggestionSearch onCloseAddPinWindowClick={this.props.onCloseAddPinWindowClick}
                            onShowManualAddPinClick={this.onShowManualAddPinClick}
                            lat={this.props.lat}
                            lng={this.props.lng}
          />
        }
      </div>
    );
  }
}