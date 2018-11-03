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