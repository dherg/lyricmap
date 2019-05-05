import React, {Component} from 'react';
import logo from './logo.svg';

import { Link, NavLink } from 'react-router-dom';

import AddPinButton from './AddPinButton';
import GoogleSignIn from './GoogleSignIn';
import SearchBar from './SearchBar';
import Random from './Random';

// Site header bar
export default class Header extends Component {

  constructor(props) {
    super(props);
    this.updateCurrentUser = this.updateCurrentUser.bind(this);
    this.handlePromptForName = this.handlePromptForName.bind(this);

    this.state = {
      displayName: ""
    }
  }

  updateCurrentUser(newUserID, newName) {
    window.globalCurrentUser.userID = newUserID;
    window.globalCurrentUser.displayName = newName;
    this.setState({"displayName": ""}); // set state to same thing - force rerender of displayname after it is updated in signin
  }

  handlePromptForName(userID) {
    this.props.handlePromptForName(userID)
  }

  render() {

    // get currently logged in user info
    const userNav = (window.globalCurrentUser.displayName == null ? "" : window.globalCurrentUser.displayName);
    var userLink = (window.globalCurrentUser.userID == null ? "user" : window.globalCurrentUser.userID);

    // conditionally render header links based on whether on map page or not
    // true if on map page, false or undefined if not
    let headerBox;
    if (this.props.onMapPage) {
      headerBox = (
        <div className="Header-link-box">
          <div className="Header-link">
            <Random handleRandomClick={this.props.handleRandomClick}/>
          </div>
          <div className="Header-link">
            <NavLink to="about">About</NavLink> 
          </div>
          <AddPinButton handleAddPinButton={this.props.handleAddPinButton} isAddingPin={this.props.isAddingPin}/>
          <SearchBar changeMapCenter={this.props.changeMapCenter} />
        </div>
      ); // end headerBox assignment
    } else {
      headerBox = (
        <div className="Header-link-box">
          <div className="Header-link">
            <NavLink to="/about">About</NavLink> 
          </div>
        </div>
      ); // end headerBox assignment
    }

    return (
      <div className="App-header">
        <div id="Logo-box">
          <Link to="/" className="Logo-box">
            <div>
              Lyric Map
            </div>
          </Link>
        </div>
        <div id="Header-Nonlogo">
          <div id="Sign-In-Box">
            <div className="Sign-In-Box-Element">
              <NavLink to={"/users/" + window.globalCurrentUser.userID}>
                 {userNav}
              </NavLink> 
            </div>
            <div className="Sign-In-Box-Element">
              <GoogleSignIn handleUpdateCurrentUser={this.updateCurrentUser} handlePromptForName={this.handlePromptForName}/>
            </div>
          </div>
          {headerBox}
        </div>
      </div>
    ); // close return
  } // close render()
}