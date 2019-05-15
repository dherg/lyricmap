package main

import (
    "log"
    "fmt"
    "time"
    "net/http"
    "io/ioutil"
    "encoding/json"
    "errors"
    "database/sql"
)

// registerUser registers a new user in the user table with id userID
func registerUser(userID string) error {
    log.Printf("registering user %s", userID)

    creationTime := time.Now()

    sqlStatement := `INSERT INTO users (id, created_time)
                        VALUES($1, $2)
                    `
    _, err := db.Exec(sqlStatement, userID, creationTime)
    if err != nil {
        panic(err)
    }
    return err
}

func checkRequestAuthentication(r *http.Request) (string, bool, error) {
    session, err := sessionStore.Get(r, "lyricmap")
    if err != nil {
        panic(err)
    }

    // Check if user is authenticated
    if session.Values["authenticated"] == nil {
        log.Println("No authenticated field found in session cookie")
        return "", false, err
    } else if auth, ok := session.Values["authenticated"].(bool); !ok || !auth  {
        return session.Values["userID"].(string), false, err
    } else {
        return session.Values["userID"].(string), true, err
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
    log.Printf("saving session with userID = %v and authenticated = true", userID)
    session.Values["userID"] = userID
    session.Values["authenticated"] = true
    session.Save(r, w)

    // return no error 
    return nil
}

// revokeUserSession removes a user's authentication from session
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

// updateDisplayName updates the given userID's display name in the users table to newName
func updateDisplayName(userID string, newName string) {
    log.Println("updating displayname of ", userID, " to ", newName)

    sqlStatement := `UPDATE users 
                        SET display_name = $1
                        WHERE id = $2
                    `
    _, err := db.Exec(sqlStatement, newName, userID)
    if err != nil {
        panic(err)
    }
}

// getUserDisplayName gets the display name for a given userID, returns "" if no display name found
func getUserDisplayName(userID string) (string, error) {
    log.Println("Getting display name for ", userID)

    sqlStatement := `SELECT display_name FROM users WHERE id=$1;`

    var displayName sql.NullString
    row := db.QueryRow(sqlStatement, userID)
    switch err := row.Scan(&displayName); err {
    case sql.ErrNoRows:
        log.Printf("No rows were returned for user ID %s", userID)
        return "", err
    case nil:
        if displayName.Valid {
            log.Println("display name: ", displayName.String)
            return displayName.String, nil
        } else {
            log.Printf("No display name set for user ID %s", userID)
            return "", nil
        }
    default:
        panic(err)
    }
}

// checkUserLogIn checks for a session cookie to tell if the user is logged in or not.
// If so, the response contains the user's userID and display name.
// If not, the response is 403
func checkUserLogIn(w http.ResponseWriter, r *http.Request) {
    
    userID, isAuthenticated, err := checkRequestAuthentication(r)
    if err != nil {
        http.Error(w, "Login can't be completed at this time", http.StatusInternalServerError)
        panic(err)
        return
    }

    if userID != "" && isAuthenticated {
        displayName, err := getUserDisplayName(userID)
        if err == sql.ErrNoRows {
            log.Printf("no user found for userID %v even though should have been registered!", userID)
            http.Error(w, "Login can't be completed at this time", http.StatusInternalServerError)
            panic(err)
            return
        } else if err != nil {
            http.Error(w, "Login can't be completed at this time", http.StatusInternalServerError)
            panic(err)
            return
        }
        // return userID and displayName
        // set header response content type to JSON
        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode(
            struct {
                DisplayName string
                UserID string
            }{
                displayName,
                userID,
            })
    } else {
        // return 403 unauthorized
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return
    }


}

// handleUserLogIn takes a request with a google ID token, validates the token, and creates a user session
// the userID will be added to the users table if not already added
func handleUserLogIn(w http.ResponseWriter, r *http.Request) {

    // get token out of request
    body, err := ioutil.ReadAll(r.Body)
    if err != nil {
        panic(err)
    }
    var token IDToken
    err = json.Unmarshal(body, &token)
    if err != nil {
        panic(err)
    }

    userID, err := validateGoogleToken(token.IDToken) // TODO: get sub from this response to use as the google ID
    // if err != nil, do not log user in. ID is not valid
    if err != nil {
        log.Printf("Token = %s found invalid, not logging in.")
        http.Error(w, "Invalid Google ID", http.StatusUnauthorized)
    }

    // Check to see whether user for this token is registered or not.
    // If not registered, register user
    log.Printf(userID)
    // if userID == "", error out
    if userID == "" {
        log.Printf("403: userID == \"\"")
        http.Error(w, "userID not found", http.StatusUnauthorized)
        return
    }
    row := db.QueryRow(`SELECT FROM users WHERE id = $1`, userID)
    err = row.Scan()
    if err == sql.ErrNoRows { // user is not registered
        log.Printf("user %s is not registered, registering", userID)
        // insert user
        err = registerUser(userID)
        if err != nil {
            panic(err)
        }
    } else if err != nil {
        panic(err)
    }

    // Create session for user
    err = createUserSession(userID, w, r)
    if err != nil {
        panic(err)
    }

    // Write display name in response
    displayName, err := getUserDisplayName(userID)
    if err == sql.ErrNoRows {
        log.Printf("no user found for userID %v even though should have been registered!", userID)
        http.Error(w, "Login can't be completed at this time", http.StatusInternalServerError)
        panic(err)
        return
    }
    // set header response content type to JSON
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(
        struct {
            DisplayName string
        }{
            displayName,
        })
}