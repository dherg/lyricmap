import React, {Component} from 'react';

export default class UpdateDisplayNameBox extends Component {

  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);

    this.state = {
      'text': "",    
    };
  }

  // handle clicking the "submit" button
  handleSubmit() {
    this.props.updateDisplayName(this.state.text);
  }

  // handle change in text box
  handleChange(event) {
    this.setState({text: event.target.value});
  }

  handleKeyPress(e) {
    if (e.key === 'Enter' && this.state.text !== '') {
      this.handleSubmit();
    }
  }

  render() {
    return(
      <div>
        <input id="address" type="textbox" placeholder="Enter new name" value={this.state.text} onChange={this.handleChange} onKeyPress={this.handleKeyPress}/>
        <input id="submit" type="button" value="Update display name" onClick={this.handleSubmit}/>
      </div>
    );
  }
}