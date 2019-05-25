import React, {Component} from 'react';

import UpdateDisplayNameModal from './UpdateDisplayNameModal';
import UserAddedPin from './UserAddedPin';

import { getPins } from './App';
import { putDisplayName } from './App';

import ListGroup from 'react-bootstrap/ListGroup'
import Spinner from 'react-bootstrap/Spinner'

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
            that.setState({
                  "isLoadingUserDetails": false, 
                  "displayName": data["DisplayName"],
                  "userFound": true,
            });
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

    // show spinner unless user details and user pin list have loaded
    if (this.state.isLoadingUserDetails || this.state.userAddedPinList === null) {
      return(
        <div id="User-Page">
          <Spinner animation="border" role="status">
            <span className="sr-only">Loading...</span>
          </Spinner>
        </div>
      );
    }

    var onCurrentUsersPage = this.props.currentUser && (this.props.currentUser.userID === this.props.userID);

    let updateDisplayNameLink;
    if (onCurrentUsersPage) {
      updateDisplayNameLink = <div onClick={this.handleShowDisplayNameChangeModal}> (Change Name) </div>
    } else {
      updateDisplayNameLink = null;
    }

    var pinListComponents = this.pinListToComponents(this.state.userAddedPinList);

    var pinListTitle = null;
    if (onCurrentUsersPage) {
      if (pinListComponents && pinListComponents.length === 0) {
        pinListTitle = <div> You haven't added any pins yet. <a href="/"> Go add some! </a> </div>
      } else {
        pinListTitle = "Your pins"
      }
    } else {
      if (pinListComponents && pinListComponents.length === 0) {
        pinListTitle = "This user hasn't added any pins!"
      } else {
        pinListTitle = this.state.userFound ? this.state.displayName + "'s pins" : null
      }
    }

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
            <div id="User-Added-Pin-List-Title">
              {pinListTitle}
            </div>
            <ListGroup>
              {pinListComponents}
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