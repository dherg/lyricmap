import React, {Component} from 'react';

import { putDisplayName } from './App';

// modal to prompt new user to set their display name
export default class NamePrompt extends Component {
  constructor(props) {
    super(props);
    this.handleNicknameInputChange = this.handleNicknameInputChange.bind(this);
    this.validateSubmission = this.validateSubmission.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);

    this.state = {
      nickname: "",
    };
  }

  handleNicknameInputChange(event) {
    this.setState({
      nickname: event.target.value
    });
  }

  validateSubmission() {
    if (this.state.nickname === "") {
      alert("Your nickname can't be blank!");
      return(false)
    } else if (this.state.nickname.length > 32) {
      alert("Your nickname can't be longer than 32 characters")
      return(false)
    } else {
      return(true)
    }

  }

  handleSubmit() {
    // validate the text, do nothing if submission not valid
    if (!this.validateSubmission()) {
      return;
    }

    // Put new display name
    putDisplayName(this.state.nickname)

    // close name prompt
    this.props.closeNamePrompt();

  }

  render() {
    return(
      <div id="Name-Prompt-Box">
        <div>
          To finish setting up your account, give yourself a nickname! 
        </div>
        <input id="Name-Prompt-Input" type="textbox" placeholder="Your new nickname" onChange={this.handleNicknameInputChange}/>
        <input className="submit" type="button" value="Submit Name" onClick={this.handleSubmit}/>
        <div>
          (Don't worry, you can change this later on your user page.)
        </div>
      </div>
    )
  }

}