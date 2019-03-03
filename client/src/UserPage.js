import React, {Component} from 'react';

import Header from './Header';
import UpdateDisplayNameBox from './UpdateDisplayNameBox';
import UserAddedPin from './UserAddedPin';

import { getPins } from './App';
import { putDisplayName } from './App';

export default class UserPage extends Component {

  constructor(props) {
    super(props);
    this.handleUpdateDisplayName = this.handleUpdateDisplayName.bind(this);
    this.handleUserUpdate = this.handleUserUpdate.bind(this);

    var userID = this.props.match.params.id;
    console.log(userID)
    if (typeof userID !== "undefined" && userID !== "") {
      console.log('got real userID. fetching display name')
      this.fetchUserDetails(userID)
      this.fetchUserPins(userID)
    }

    this.state = {
      'isLoadingUserDetails': true,
      'displayName': "", // Only a valid display name when isLoading = false
      'userFound': false,
      'userAddedPinList': null,
    };
  }

  // get the list of pins a user has created via GET to /pins?addedBy={userID}
  fetchUserPins(userID) {
    getPins(userID).then(data => {
      this.setState({
        userAddedPinList: data,
      });
      // this.props.handlePinListUpdate(this.state.pinList);
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
          })
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

  handleUserUpdate(newName) {
    console.log('here in ahndleuserupdate')
    if (newName !== null) {
      this.setState({
        "isLoadingUserDetails": false, 
        "displayName": newName,
        "userFound": true,
      })
    }
  }

  pinListToComponents(pinList) {
        if (pinList === null) {
          return;
        } else {
          console.log('pinList');
          console.log(pinList);
          return (
              pinList.map(pin => <UserAddedPin pinID={pin.PinID} pinTitle={pin.Title} pinArtist={pin.Artist}/>)
          );
        }
    }


  render() {

    const name = (this.state.userFound ? this.state.displayName : "User not found!");
    const display = (this.state.isLoadingUserDetails ? "Loading..." : name);

    // only show box to change display name if on the currently logged in user's page
    const updateDisplayNameBox = (this.props.match.params.id === window.globalCurrentUser.userID ? 
                                  <UpdateDisplayNameBox updateDisplayName={this.handleUpdateDisplayName}/> :
                                  null);

    return (
      <div>
        <Header handleUserUpdate={this.handleUserUpdate}/>
        <div className="UserPage">
          {display}
        </div>
          {updateDisplayNameBox}
          Pins added by this user:
          {this.pinListToComponents(this.state.userAddedPinList)}
      </div>
    );
  }
}