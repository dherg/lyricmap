import React, {Component} from 'react';
import logo from './logo.svg';

import { Link, NavLink } from 'react-router-dom';

import AddPinButton from './AddPinButton';
import GoogleSignIn from './GoogleSignIn';
import SearchBar from './SearchBar';
import Random from './Random';

import Navbar from 'react-bootstrap/Navbar'
import Form from 'react-bootstrap/Form'
import Nav from 'react-bootstrap/Nav'
import Button from 'react-bootstrap/Button'
import FormControl from 'react-bootstrap/FormControl'

// Site header bar
export default class Header extends Component {

  constructor(props) {
    super(props);
    this.updateCurrentUser = this.updateCurrentUser.bind(this);
    this.handlePromptForName = this.handlePromptForName.bind(this);

    this.state = {
      currentUser: null,
    }
  }

  updateCurrentUser(newUserID, newName) {
    window.globalCurrentUser.userID = newUserID;
    window.globalCurrentUser.displayName = newName;
    this.setState({currentUser: {
                                  userID: newUserID,
                                  displayName: newName
                                }
                  }); // set state to same thing - force rerender of displayname after it is updated in signin
    if (this.props.handleUpdateCurrentUser) {
      this.props.handleUpdateCurrentUser(this.state.currentUser);
    }
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

    let navLinks;
    if (this.props.onMapPage) {
      navLinks = (
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="mr-auto">
            <Nav.Link href="/about">About</Nav.Link>
            <Nav.Link onClick={this.props.handleRandomClick}>Random Pin</Nav.Link>
            <Nav.Link onClick={this.props.handleAddPinButton}>Add Pin</Nav.Link>
            <Form inline>
              <FormControl type="text" placeholder="Search" className="mr-sm-2" />
              <Button variant="outline-success">Search</Button>
            </Form>
          </Nav>
          <Nav.Link href={"/users/" + window.globalCurrentUser.userID}> {userNav} </Nav.Link>
          <GoogleSignIn handleUpdateCurrentUser={this.updateCurrentUser} handlePromptForName={this.handlePromptForName}/>
        </Navbar.Collapse>
      );
    } else {
      navLinks = (
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="mr-auto">
            <Nav.Link href="/about">About</Nav.Link>
          </Nav>
          <Nav.Link href={"/users/" + window.globalCurrentUser.userID}> {userNav} </Nav.Link>
          <GoogleSignIn handleUpdateCurrentUser={this.updateCurrentUser} handlePromptForName={this.handlePromptForName}/>
        </Navbar.Collapse>
      );
    }

    return (
      <Navbar>
        <Navbar.Brand href="/">Lyric Map</Navbar.Brand>
        {navLinks}
      </Navbar>
    ); // close return
  } // close render()
}