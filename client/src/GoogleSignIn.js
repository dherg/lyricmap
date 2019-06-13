import React, { Component } from 'react';

export default class GoogleSignIn extends Component {
  constructor(props) {
    super(props);
    this.onSignIn = this.onSignIn.bind(this);
  }

  componentDidMount() {
    window.gapi.load('auth2');
    window.gapi.signin2.render('my-signin2', {
      scope: 'email',
      theme: 'dark',
      onsuccess: this.onSignIn,
    });
  }

  onSignIn(googleUser) {
    const profile = googleUser.getBasicProfile();

    // get google ID token
    const { id_token } = googleUser.getAuthResponse();

    // get url for environment
    const url = `${process.env.REACT_APP_LYRICMAP_API_HOST}/login`;

    // post ID token to server
    fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idtoken: id_token,
      }),
    })
      .then(res => res.json())
      .then((res) => {
        if (res.DisplayName !== '') {
          this.props.handleUpdateCurrentUser(profile.getId(), res.DisplayName);
        } else if (res.DisplayName === '') {
          this.props.handlePromptForName(profile.getId());
        }
        this.props.handleSignInFinished();
      });
  }

  render() {
    return (
      <div id="my-signin2" data-onsuccess="onSignIn" />
    );
  }
}
