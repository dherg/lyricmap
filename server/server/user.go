package main

import (
    "log"
    "fmt"
    "net/http"
    "io/ioutil"
    "encoding/json"
    "errors"
)

// registerUser registers a new user in the user table with id userID
func registerUser(userID string) error {
    sqlStatement := `INSERT INTO users (id)
                        VALUES($1)
                    `
    _, err := db.Exec(sqlStatement, userID)
    return err
}

func checkRequestAuthentication(r *http.Request) (bool, error) {
    session, err := sessionStore.Get(r, "lyricmap")
    if err != nil {
        panic(err)
    }

    // Check if user is authenticated
    log.Println("session.Values['authenticated']")
    log.Println(session.Values["authenticated"])
    log.Println("in checkrequestauthentication, session.Values[\"authenticated\"] = %v", session.Values["authenticated"].(bool))
    if auth, ok := session.Values["authenticated"].(bool); !ok || !auth {
        return false, err
    } else {
        return true, err
    }
}

// validateGoogleToken, given a Google user's ID token, validates a google user ID
// by calling Google's validation endpoint, and returns a google ID if token is valud
func validateGoogleToken(token string) (string, error) {
    // validate token with call to tokeninfo
    res, err := http.Get(fmt.Sprintf("https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=%v", token))
    if err != nil {
        panic(err)
    }
    defer res.Body.Close()

    // check that response is 200 (i.e. valid token) TODO: also need to check aud field for lyricmap's client id
    if res.StatusCode != 200 {
        return "", errors.New(fmt.Sprintf("Token validation failed. tokeninfo check returned %v (!= 200)", res.StatusCode))
    }

    // get userID from sub field
    body, err := ioutil.ReadAll(res.Body)
    var tokenResponse IDToken
    err = json.Unmarshal(body, &tokenResponse)
    if err != nil {
        panic(err)
    }

    // return no error (valid token)
    return tokenResponse.Sub, nil
}

// createUserSession creates a new authenticated user session for a given userID
func createUserSession(userID string, w http.ResponseWriter, r *http.Request) error {
    // Get a session. Get() always returns a session, even if empty.
    session, err := sessionStore.Get(r, "lyricmap")
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return err
    }

    // set user_id session value and save
    log.Println("saving session with user_id = %v and authenticated = true", userID)
    session.Values["user_id"] = userID
    session.Values["authenticated"] = true
    session.Save(r, w)

    // return no error 
    return nil
}

// revokeUserSession removes a user's authenication from session
func revokeUserSession(w http.ResponseWriter, r *http.Request) error {
    // get session
    session, err := sessionStore.Get(r, "lyricmap")
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return err
    }

    // set `authenticated` field to false
    log.Println("revoking authentication for user_id = ", session.Values["userID"])
    session.Values["authenticated"] = false
    session.Save(r, w)

    // return no error
    return nil
}