import React, {Component} from 'react';

import Button from 'react-bootstrap/Button'

export default class GoogleSignIn extends Component {

  constructor(props) {
    super(props);
    this.onSignIn = this.onSignIn.bind(this);
  }

  componentDidMount() {
    window.gapi.load('auth2');
    window.gapi.signin2.render('my-signin2', {
        'scope': 'email',
        // 'width': 80,
        // 'height': 20,
        // 'longtitle': false,
        'theme': 'dark',
        'onsuccess': this.onSignIn,
    });
  }

  onSignIn(googleUser) {
    var profile = googleUser.getBasicProfile();
    console.log('ID: ' + profile.getId()); // Do not send to your backend! Use an ID token instead.
    console.log('Name: ' + profile.getName());
    console.log('Image URL: ' + profile.getImageUrl());
    console.log('Email: ' + profile.getEmail()); // This is null if the 'email' scope is not present.

    // get google ID token
    var id_token = googleUser.getAuthResponse().id_token;
    console.log('id_token: ' + id_token)

    // get url for environment 
    var url = process.env.REACT_APP_LYRICMAP_API_HOST + '/login';

    // post ID token to server
    fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idtoken: id_token,
      })
    })
    .then(res => res.json() )
    .then(res => { 
      console.log(res)
      if (res["DisplayName"] !== "") {
        this.props.handleUpdateCurrentUser(profile.getId(), res["DisplayName"]);
      } else if (res["DisplayName"] === "") {
        console.log("prompt to set display name")
        this.props.handlePromptForName(profile.getId())
      }
    });

  } // end onSignIn()

  render() {
    return (
          <div id="my-signin2" data-onsuccess={"onSignIn"}></div>
    );
  }
}