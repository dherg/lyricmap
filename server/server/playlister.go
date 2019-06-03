package main

import (
    "fmt"
    "log"
    "os" 
    "net/http"

    "github.com/zmb3/spotify"
)

// OAuth redirect URI
var redirectURI = os.Getenv("LYRICMAP_API_HOST") + "/api/playlistercallback"

var (
    auth  = spotify.NewAuthenticator(redirectURI, spotify.ScopeUserReadPrivate)
    ch    = make(chan *spotify.Client)
    state = generateID() // generate random string for oauth state
)

var playlisterClient spotify.Client

// completeAuth is called by the Spotify callback to retrieve OAuth tokens
func completeAuth(w http.ResponseWriter, r *http.Request) {
    tok, err := auth.Token(state, r)
    if err != nil {
        http.Error(w, "Couldn't get token", http.StatusForbidden)
        log.Fatal(err)
    }
    if st := r.FormValue("state"); st != state {
        http.NotFound(w, r)
        log.Fatalf("State mismatch: %s != %s\n", st, state)
    }
    // use the token to get an authenticated client
    playlisterClient := auth.NewClient(tok)
    fmt.Fprintf(w, "Login Completed!")
    user, err := playlisterClient.CurrentUser()
    if err != nil {
        log.Fatal(err)
    }
    fmt.Println("You are logged in as:", user.ID)
    return
}


func setupClient(w http.ResponseWriter, r *http.Request) {

    // check if user is approved
    userID, isAuthenticated, err := checkRequestAuthentication(r)
    if err != nil {
        panic(err)
        return
    }
    if isAuthenticated != true || userID != os.Getenv("PLAYLISTER_ADMIN_ID") {
        // return 403 forbidden
        http.Error(w, "Forbidden", http.StatusForbidden)
        return
    }

    // redirect to Spotify login URL
    url := auth.AuthURL(state)
    http.Redirect(w, r, url, http.StatusFound)

}
