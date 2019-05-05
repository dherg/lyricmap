import React, {Component} from 'react';

import Header from './Header';
import UpdateDisplayNameModal from './UpdateDisplayNameModal';
import UserAddedPin from './UserAddedPin';

import { getPins } from './App';
import { putDisplayName } from './App';

import { Link, NavLink } from 'react-router-dom';

import ListGroup from 'react-bootstrap/ListGroup'
import Modal from 'react-bootstrap/Modal'

export default class UserPage extends Component {

  constructor(props) {
    super(props);
    this.handleUpdateDisplayName = this.handleUpdateDisplayName.bind(this);
    this.handleShowDisplayNameChangeModal = this.handleShowDisplayNameChangeModal.bind(this);
    this.handleHideDisplayNameChangeModal = this.handleHideDisplayNameChangeModal.bind(this);

    this.state = {
      'isLoadingUserDetails': true,
      'displayName': "", // Only a valid display name when isLoading = false
      'userFound': false,
      'userAddedPinList': null,
      'showChangeDisplayNameModal': false,
    };

    var userID = this.props.userID;
    if (typeof userID !== "undefined" && userID !== "") {
      console.log('got real userID. fetching display name')
      this.fetchUserDetails(userID)
      this.fetchUserPins(userID)
    }

  }

  componentDidUpdate(prevProps) {
    if (prevProps.userID !== this.props.userID) {
      var userID = this.props.userID;
      if (typeof userID !== "undefined" && userID !== "") {
        console.log('got real userID. fetching display name')
        this.fetchUserDetails(userID)
        this.fetchUserPins(userID)
      }
    }
  }

  // get the list of pins a user has created via GET to /pins?addedBy={userID}
  fetchUserPins(userID) {
    getPins(userID).then(data => {
      this.setState({
        userAddedPinList: data,
      });
    });
  }

  // get the user details via GET to /users endpoint, update the state with
  // the display name, and change isLoading to false
  fetchUserDetails(userID) {
    // get url for environment 
    var url = process.env.REACT_APP_LYRICMAP_API_HOST + '/users';
    var that = this;
    fetch(url + '?id=' + String(userID), {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      })
      .then(res => {
        if (res.status === 404) {
          this.setState({
            'isLoadingUserDetails': false,
            'displayName': "",
            'userFound': false,
            'userAddedPinList': null,
          });
        } else if (res.status !== 200) {
          throw new Error("Not 200 response");
        } else {
          res.json().then(function(data) {
              if (data["DisplayName"] !== "") {
                that.setState({
                  "isLoadingUserDetails": false, 
                  "displayName": data["DisplayName"],
                  "userFound": true,
                })
              }
          })
        }
      })
      .catch(function(err) {
        console.log(err)
      }); // end fetch()
  }

  // PUT new display name for the currently logged in user
  handleUpdateDisplayName(newName) {
    var fetchedName = putDisplayName(newName);
    if (fetchedName !== null) {
      this.setState({
        isLoadingUserDetails: false,
        userFound: true,
        displayName: fetchedName,
      });
      window.globalCurrentUser.displayName = fetchedName;
    }
  }

  handleShowDisplayNameChangeModal() {
    this.setState({
      showChangeDisplayNameModal: true
    })
  }

  handleHideDisplayNameChangeModal() {
    this.setState({
      showChangeDisplayNameModal: false
    })
  }

  pinListToComponents(pinList) {
        if (pinList === null) {
          return;
        } else {

          // convert list of pins to useraddedpin components with passed in props
          var pinArray = [];
          var i;
          for (i = 0; i < pinList.length; i++) {
            var pin = pinList[i];
            var newComponent = <UserAddedPin index={i+1} key={pin.PinID} pinID={pin.PinID} pinTitle={pin.Title} pinArtist={pin.Artist}/>
            pinArray.push(newComponent)
          }
          return(pinArray);
        }
    }


  render() {

    const name = (this.state.userFound ? this.state.displayName : "User not found!");
    const display = (this.state.isLoadingUserDetails ? "Loading..." : name);

    // only show option to change display name if on the currently logged in user's page
    const updateDisplayNameLink = (this.props.userID === window.globalCurrentUser.userID ? 
                                  <div onClick={this.handleShowDisplayNameChangeModal}> (Change Name) </div> :
                                  null
                                  );
    console.log('name, display', name, display);

    return (
      <div>
        <div id="User-Page">
          <div id="User-Display-Name">
            <div id="Display-Name">
              {display}
            </div>
            <div id="Display-Name-Update-Link">
              {updateDisplayNameLink}
            </div>
          </div>
          <div id="User-Added-Pin-Display">
            {this.state.userFound ? this.state.displayName + "'s pins" : null}
            <ListGroup>
              {this.pinListToComponents(this.state.userAddedPinList)}
            </ListGroup>
          </div>
        </div>
        <UpdateDisplayNameModal show={this.state.showChangeDisplayNameModal} 
                                handleHideModal={this.handleHideDisplayNameChangeModal}
                                updateDisplayName={this.handleUpdateDisplayName}/>
      </div>
    );
  }
}