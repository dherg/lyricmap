import React, {Component} from 'react';
import PropTypes from 'prop-types';

export default class Pin extends Component {
  static propTypes = {
    text: PropTypes.string
  };

  static defaultProps = {
    text : 'test',
  };

  render() {
    return (

        <div className="Pin-container">
            <div className="Pin-body" onClick={() => this.props.onPinClick(this.props.text)}>
                {this.props.text}
            </div>
        </div>

    );
  }
}