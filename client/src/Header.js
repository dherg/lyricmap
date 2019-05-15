import React, {Component} from 'react';
import logo from './logo.svg';

import { Link, NavLink } from 'react-router-dom';

import AddPinButton from './AddPinButton';
import SearchBar from './SearchBar';
import SignInModal from './SignInModal';
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
    this.handleSignInButtonClick = this.handleSignInButtonClick.bind(this);
    this.handleCloseSignInModalClick = this.handleCloseSignInModalClick.bind(this);
    this.handleSignOutButtonClick = this.handleSignOutButtonClick.bind(this);
    

    this.state = {
      currentUser: null,
      showSignInModal: false, 
    }
  }

  componentDidMount() {
    // Make request
    var url = process.env.REACT_APP_LYRICMAP_API_HOST + '/login';
    fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    })
    .then(function(res) {
        if (res.status === 403) {
          return(null)
        } else if (res.status >= 400) {
          throw new Error("Bad response from server when checking if logged in.");
        }
        return res.json();
      }
    )
    .then(res => { 
      // return null in case of 403
      if (res == null) {
        return;
      }
      console.log(res)
      if (res["DisplayName"] !== null && res["UserID"] !== null) {
        this.updateCurrentUser(res["UserID"], res["DisplayName"])
      }
    });
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
    this.props.handlePromptForName(userID);
  }

  handleSignInButtonClick() {
    this.setState({
      showSignInModal: true,
    });
  }

  handleCloseSignInModalClick() {
    this.setState({
      showSignInModal: false,
    });
  }

  handleSignOutButtonClick() {
    // sign out of google 
    window.gapi.load('auth2', 
      function() { 
        window.gapi.auth2.init(); 
        var auth2 = window.gapi.auth2.getAuthInstance();
        console.log('auth2:', auth2);
        auth2.signOut()
      });

     // send request to backend to signout
    var url = process.env.REACT_APP_LYRICMAP_API_HOST + '/logout';
    fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    })

    // set user vars
    this.setState({
      currentUser: null,
      showSignInModal: false
    });
    window.globalCurrentUser.displayName = null;
    window.globalCurrentUser.userID = null; 
  }

  render() {

    // get currently logged in user info
    const userNav = (window.globalCurrentUser.displayName == null ? "" : window.globalCurrentUser.displayName);
    var userLink = (window.globalCurrentUser.userID == null ? "user" : window.globalCurrentUser.userID);

    const signInButton = <Button variant="primary" onClick={this.handleSignInButtonClick}> Sign In </Button>
    const signOutButton = <Button variant="primary" onClick={this.handleSignOutButtonClick}> Sign Out </Button>

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
              <FormControl type="text" placeholder="Search for a location" className="mr-sm-2" />
              <Button variant="outline-success">Search</Button>
            </Form>
          </Nav>
          <Nav.Link href={"/users/" + window.globalCurrentUser.userID}> {userNav} </Nav.Link>
          {window.globalCurrentUser.userID == null ? signInButton : signOutButton}
        </Navbar.Collapse>
      );
    } else {
      navLinks = (
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="mr-auto">
            <Nav.Link href="/about">About</Nav.Link>
          </Nav>
          <Nav.Link href={"/users/" + window.globalCurrentUser.userID}> {userNav} </Nav.Link>
          {window.globalCurrentUser.userID == null ? signInButton : signOutButton}
        </Navbar.Collapse>
      );
    }

    return (
      <div>
        <Navbar>
          <Navbar.Brand href="/">Lyric Map</Navbar.Brand>
          {navLinks}
        </Navbar>
        <SignInModal show={this.state.showSignInModal} 
                     updateCurrentUser={this.updateCurrentUser} 
                     handlePromptForName={this.handlePromptForName}
                     handleHideModal={this.handleCloseSignInModalClick}
                     handleSignOutButtonClick={this.handleSignOutButtonClick}/>
      </div>
    ); // close return
  } // close render()
}