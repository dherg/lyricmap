import React, {Component} from 'react';

import SearchBar from './SearchBar';
import SignInModal from './SignInModal';

import Nav from 'react-bootstrap/Nav'
import Navbar from 'react-bootstrap/Navbar'
import Button from 'react-bootstrap/Button'

// Site header bar
export default class Header extends Component {

  constructor(props) {
    super(props);
    this.updateCurrentUser = this.updateCurrentUser.bind(this);
    this.handlePromptForName = this.handlePromptForName.bind(this);
    this.handleSignInButtonClick = this.handleSignInButtonClick.bind(this);
    this.handleCloseSignInModalClick = this.handleCloseSignInModalClick.bind(this);
    this.handleSignOutButtonClick = this.handleSignOutButtonClick.bind(this);
    this.toggleNavExpanded = this.toggleNavExpanded.bind(this);
    this.handleCollapseNavBar = this.handleCollapseNavBar.bind(this);
    this.handleRandomClick = this.handleRandomClick.bind(this);
    this.handleAddPinButton = this.handleAddPinButton.bind(this);

    this.state = {
      currentUser: null,
      showSignInModal: false, 
      navExpanded: false,
    }
  }

  componentDidMount() {
    // Check if user is logged in and get display name
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
      // Check if we need prompt for user to set a display name or just set user as logged in
      if (res["UserID"] !== null) {
        if (res["DisplayName"] === "") {
          this.handlePromptForName(res["UserID"])
        } else {
          this.updateCurrentUser(res["UserID"], res["DisplayName"])
        }
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

  toggleNavExpanded() {
    this.setState({
      navExpanded: !this.state.navExpanded,
    })
    this.props.onToggleNavBarClick();
  }

  handleCollapseNavBar() {
    this.setState({
      navExpanded: false,
    });
    this.props.onToggleNavBarClick();
  }

  handleRandomClick() {
    this.handleCollapseNavBar();
    this.props.handleRandomClick();
  }

  handleAddPinButton() {
    this.handleCollapseNavBar();
    this.props.handleAddPinButton();
  }

  render() {

    // get currently logged in user info
    const userNav = (window.globalCurrentUser.displayName == null ? null : <Nav.Link id="User-Display-Name-Nav" href={"/users/" + window.globalCurrentUser.userID}> {window.globalCurrentUser.displayName} </Nav.Link>);

    const signInButton = <Button variant="primary" onClick={this.handleSignInButtonClick}> Sign In </Button>
    const signOutButton = <Button variant="primary" onClick={this.handleSignOutButtonClick}> Sign Out </Button>

    let navLinks;
    if (this.props.onMapPage) {
      navLinks = (
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav id="Header-Left-Side" className="mr-auto">
            <Nav.Link href="/about">About</Nav.Link>
            <Nav.Link onClick={this.handleRandomClick}>Random Pin</Nav.Link>
            <Nav.Link onClick={this.handleAddPinButton}>Add Pin</Nav.Link>
            <SearchBar changeMapCenter={this.props.changeMapCenter} onSearchSubmitClick={this.props.onSearchSubmitClick} closeNavIfExpanded={this.handleCollapseNavBar}/>
          </Nav>
          <Nav id="Header-Right-Side" className="ml-auto">
            {userNav}
            {window.globalCurrentUser.userID == null ? signInButton : signOutButton}
          </Nav>
        </Navbar.Collapse>
      );
    } else if (this.props.onAboutPage) {
      navLinks = (
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav id="Header-Left-Side" className="mr-auto">
            <Nav.Link href="/about">About</Nav.Link>
            <Nav.Link onClick={this.handleAddPinButton}>Add Pin</Nav.Link>
            <SearchBar changeMapCenter={this.props.changeMapCenter} onSearchSubmitClick={this.props.onSearchSubmitClick} closeNavIfExpanded={this.handleCollapseNavBar}/>
          </Nav>
          <Nav id="Header-Right-Side" className="ml-auto">
            {userNav}
            {window.globalCurrentUser.userID == null ? signInButton : signOutButton}
          </Nav>
        </Navbar.Collapse>
      );
    } else {
      navLinks = (
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav id="Header-Left-Side" className="mr-auto">
            <Nav.Link href="/about">About</Nav.Link>
          </Nav>
          <Nav id="Header-Right-Side" className="ml-auto">
            {userNav}
            {window.globalCurrentUser.userID == null ? signInButton : signOutButton}
          </Nav>
        </Navbar.Collapse>
      );
    }

    return (
      <div id="Header-Bar">
        <Navbar onSelect={this.handleCollapseNavBar} 
                expanded={this.state.navExpanded} 
                onToggle={this.toggleNavExpanded} 
                expand="lg" 
                bg="dark" 
                variant="dark">
          <Navbar.Brand href="/">Lyric Map</Navbar.Brand>
          <Navbar.Toggle onClick={this.toggleNavExpanded} aria-controls="responsive-navbar-nav" />
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