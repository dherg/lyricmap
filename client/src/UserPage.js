import React, {Component} from 'react';

import Header from './Header';
import UpdateDisplayNameBox from './UpdateDisplayNameBox';

import { putDisplayName } from './App';

export default class UserPage extends Component {

  constructor(props) {
    super(props);
    this.handleUpdateDisplayName = this.handleUpdateDisplayName.bind(this);

    var userID = this.props.match.params.id;
    console.log(userID)
    if (typeof userID !== "undefined" && userID !== "") {
      console.log('got real userID. fetching display name')
      this.fetchUserDetails(userID)
    }

    this.state = {
      'isLoading': true,
      'displayName': "", // Only a valid display name when isLoading = false
      'userFound': false,
    };
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
            'isLoading': false,
          })
        } else if (res.status !== 200) {
          throw new Error("Not 200 response");
        } else {
          res.json().then(function(data) {
              if (data["DisplayName"] !== "") {
                that.setState({
                  "isLoading": false, 
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
    putDisplayName(newName);
  }


  render() {
    const name = (this.state.userFound ? this.state.displayName : "User not found!");
    const display = (this.state.isLoading ? "Loading..." : name);

    // only show box to change display name if on the currently logged in user's page
    const updateDisplayNameBox = (this.props.match.params.id === window.globalCurrentUser.userID ? 
                                  <UpdateDisplayNameBox updateDisplayName={this.handleUpdateDisplayName}/> :
                                  null);

    return (
      <div>
        <Header />
        <div className="UserPage">
          {display}
        </div>
        {updateDisplayNameBox}
      </div>
    );
  }
}